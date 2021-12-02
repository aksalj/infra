package registry

import (
	"fmt"
	"os"
	"regexp"
	"strings"

	"github.com/google/uuid"
	"gopkg.in/yaml.v2"
	"gorm.io/gorm"

	"github.com/infrahq/infra/internal/access"
	"github.com/infrahq/infra/internal/registry/data"
	"github.com/infrahq/infra/internal/registry/models"
	"github.com/infrahq/infra/secrets"
)

type ConfigOkta struct {
	APIToken string `yaml:"apiToken" validate:"required"`
}

type ConfigProvider struct {
	Kind         string      `yaml:"kind" validate:"required"`
	Domain       string      `yaml:"domain" validate:"required"`
	ClientID     string      `yaml:"clientID" validate:"required"`
	ClientSecret string      `yaml:"clientSecret" validate:"required"`
	Config       interface{} // contains identity-provider-specific config
}

type baseConfigProvider struct {
	Kind         models.ProviderKind `yaml:"kind"`
	Domain       string              `yaml:"domain"`
	ClientID     string              `yaml:"clientID"`
	ClientSecret string              `yaml:"clientSecret"`
}

var _ yaml.Unmarshaler = &ConfigProvider{}

func (idp *ConfigProvider) UnmarshalYAML(unmarshal func(interface{}) error) error {
	tmp := &baseConfigProvider{}

	if err := unmarshal(&tmp); err != nil {
		return fmt.Errorf("unmarshalling secret provider: %w", err)
	}

	idp.Kind = string(tmp.Kind)
	idp.Domain = tmp.Domain
	idp.ClientID = tmp.ClientID
	idp.ClientSecret = tmp.ClientSecret

	switch tmp.Kind {
	case models.ProviderKindOkta:
		o := ConfigOkta{}
		if err := unmarshal(&o); err != nil {
			return fmt.Errorf("unmarshal yaml: %w", err)
		}

		idp.Config = o
	default:
		return fmt.Errorf("unknown identity provider type %q", tmp.Kind)
	}

	return nil
}

var (
	dashAdminRemover = regexp.MustCompile(`(.*)\-admin(\.okta\.com)`)
	protocolRemover  = regexp.MustCompile(`http[s]?://`)
)

func (p *ConfigProvider) cleanupDomain() {
	p.Domain = strings.TrimSpace(p.Domain)
	p.Domain = dashAdminRemover.ReplaceAllString(p.Domain, "$1$2")
	p.Domain = protocolRemover.ReplaceAllString(p.Domain, "")
}

type ConfigDestination struct {
	Name       string                 `yaml:"name"`
	Labels     []string               `yaml:"labels"`
	Kind       models.DestinationKind `yaml:"kind" validate:"required"`
	Namespaces []string               `yaml:"namespaces"` // optional in the case of a cluster-role
}

type ConfigRole struct {
	Name         string              `yaml:"name" validate:"required"`
	Kind         models.RoleKind     `yaml:"kind" validate:"required,oneof=role cluster-role"`
	Destinations []ConfigDestination `yaml:"destinations" validate:"required,dive"`
}

type ConfigGroupMapping struct {
	Name     string       `yaml:"name" validate:"required"`
	Provider string       `yaml:"provider" validate:"required"`
	Roles    []ConfigRole `yaml:"roles" validate:"required,dive"`
}

type ConfigUserMapping struct {
	Email string       `yaml:"email" validate:"required,email"`
	Roles []ConfigRole `yaml:"roles" validate:"required,dive"`
}

type ConfigSecretProvider struct {
	Kind   string      `yaml:"kind" validate:"required"`
	Name   string      `yaml:"name"` // optional
	Config interface{} // contains secret-provider-specific config
}

type simpleConfigSecretProvider struct {
	Kind string `yaml:"kind"`
	Name string `yaml:"name"`
}

// ensure ConfigSecretProvider implements yaml.Unmarshaller for the custom config field support
var _ yaml.Unmarshaler = &ConfigSecretProvider{}

func (sp *ConfigSecretProvider) UnmarshalYAML(unmarshal func(interface{}) error) error {
	tmp := &simpleConfigSecretProvider{}

	if err := unmarshal(&tmp); err != nil {
		return fmt.Errorf("unmarshalling secret provider: %w", err)
	}

	sp.Kind = tmp.Kind
	sp.Name = tmp.Name

	switch tmp.Kind {
	case "vault":
		p := secrets.NewVaultConfig()
		if err := unmarshal(&p); err != nil {
			return fmt.Errorf("unmarshal yaml: %w", err)
		}

		sp.Config = p
	case "awsssm":
		p := secrets.AWSSSMConfig{}
		if err := unmarshal(&p); err != nil {
			return fmt.Errorf("unmarshal yaml: %w", err)
		}

		if err := unmarshal(&p.AWSConfig); err != nil {
			return fmt.Errorf("unmarshal yaml: %w", err)
		}

		sp.Config = p
	case "awssecretsmanager":
		p := secrets.AWSSecretsManagerConfig{}
		if err := unmarshal(&p); err != nil {
			return fmt.Errorf("unmarshal yaml: %w", err)
		}

		if err := unmarshal(&p.AWSConfig); err != nil {
			return fmt.Errorf("unmarshal yaml: %w", err)
		}

		sp.Config = p
	case "kubernetes":
		p := secrets.NewKubernetesConfig()
		if err := unmarshal(&p); err != nil {
			return fmt.Errorf("unmarshal yaml: %w", err)
		}

		sp.Config = p
	case "env":
		p := secrets.GenericConfig{}
		if err := unmarshal(&p); err != nil {
			return fmt.Errorf("unmarshal yaml: %w", err)
		}

		sp.Config = p
	case "file":
		p := secrets.FileConfig{}
		if err := unmarshal(&p); err != nil {
			return fmt.Errorf("unmarshal yaml: %w", err)
		}

		if err := unmarshal(&p.GenericConfig); err != nil {
			return fmt.Errorf("unmarshal yaml: %w", err)
		}

		sp.Config = p
	case "plaintext", "":
		p := secrets.GenericConfig{}
		if err := unmarshal(&p); err != nil {
			return fmt.Errorf("unmarshal yaml: %w", err)
		}

		sp.Config = p
	default:
		return fmt.Errorf("unknown secret provider type %q, expected one of %q", tmp.Kind, secrets.SecretStorageProviderKinds)
	}

	return nil
}

type Config struct {
	Secrets   []ConfigSecretProvider `yaml:"secrets" validate:"dive"`
	Providers []ConfigProvider       `yaml:"providers" validate:"dive"`
	Groups    []ConfigGroupMapping   `yaml:"groups" validate:"dive"`
	Users     []ConfigUserMapping    `yaml:"users" validate:"dive"`
}

func importProviders(db *gorm.DB, providers []ConfigProvider) error {
	toKeep := make([]uuid.UUID, 0)

	for _, p := range providers {
		p.cleanupDomain()

		// domain has been modified, so need to re-validate
		if err := validate.Struct(p); err != nil {
			return fmt.Errorf("invalid domain: %w", err)
		}

		provider := models.Provider{
			Kind:         models.ProviderKind(p.Kind),
			Domain:       p.Domain,
			ClientID:     p.ClientID,
			ClientSecret: p.ClientSecret,
		}

		switch provider.Kind {
		case models.ProviderKindOkta:
			cfg, ok := p.Config.(ConfigOkta)
			if !ok {
				return fmt.Errorf("expected provider config to be Okta, but was %t", p.Config)
			}

			provider.Okta.APIToken = cfg.APIToken

		default:
			// should never happen
			return fmt.Errorf("invalid provider kind in configuration: %s", p.Kind)
		}

		final, err := data.CreateOrUpdateProvider(db, &provider, &models.Provider{Kind: provider.Kind, Domain: provider.Domain})
		if err != nil {
			return err
		}

		toKeep = append(toKeep, final.ID)
	}

	if err := data.DeleteProviders(db, db.Model(&models.Provider{}).Not(toKeep)); err != nil {
		return err
	}

	return nil
}

func importUserRoleMappings(db *gorm.DB, users []ConfigUserMapping) ([]uuid.UUID, error) {
	toKeep := make([]uuid.UUID, 0)

	for _, u := range users {
		if err := validate.Struct(u); err != nil {
			return nil, err
		}

		user, err := data.GetUser(db, &models.User{Email: u.Email})
		if err != nil {
			continue
		}

		ids, err := importRoles(db, u.Roles)
		if err != nil {
			return nil, err
		}

		if err := data.BindUserRoles(db, user, ids...); err != nil {
			return nil, err
		}

		toKeep = append(toKeep, ids...)
	}

	return toKeep, nil
}

func importGroupRoleMappings(db *gorm.DB, groups []ConfigGroupMapping) ([]uuid.UUID, error) {
	toKeep := make([]uuid.UUID, 0)

	for _, g := range groups {
		if err := validate.Struct(g); err != nil {
			return nil, err
		}

		group, err := data.GetGroup(db, &models.Group{Name: g.Name})
		if err != nil {
			continue
		}

		ids, err := importRoles(db, g.Roles)
		if err != nil {
			return nil, err
		}

		if err := data.BindGroupRoles(db, group, ids...); err != nil {
			return nil, err
		}

		toKeep = append(toKeep, ids...)
	}

	return toKeep, nil
}

func importRoles(db *gorm.DB, roles []ConfigRole) ([]uuid.UUID, error) {
	toKeep := make([]uuid.UUID, 0)

	for _, r := range roles {
		if err := validate.Struct(r); err != nil {
			return nil, err
		}

		for _, d := range r.Destinations {
			if err := validate.Struct(d); err != nil {
				return nil, err
			}

			destinations, err := data.ListDestinations(db, db.Where(
				data.LabelSelector(db, "destination_id", d.Labels...),
				&models.Destination{Name: d.Name, Kind: d.Kind},
			))
			if err != nil {
				return nil, err
			}

		DESTINATION:
			for _, destination := range destinations {
				labels := make(map[string]bool)
				for _, l := range destination.Labels {
					labels[l.Value] = true
				}

				for _, l := range d.Labels {
					if _, ok := labels[l]; !ok {
						continue DESTINATION
					}
				}

				role := models.Role{
					Kind:        models.RoleKind(destination.Kind),
					Destination: destination,
				}

				roles := make([]models.Role, 0)

				switch role.Kind {
				case models.RoleKindKubernetes:
					role.Kubernetes = models.RoleKubernetes{
						Kind: models.RoleKubernetesKind(r.Kind),
						Name: r.Name,
					}

					if len(d.Namespaces) == 0 {
						d.Namespaces = []string{""}
					}

					for _, namespace := range d.Namespaces {
						role.Kubernetes.Namespace = namespace

						roles = append(roles, role)
					}
				}

				for i := range roles {
					role, err := data.CreateOrUpdateRole(db, &roles[i], data.StrictRoleSelector(db, &roles[i]))
					if err != nil {
						return nil, err
					}

					toKeep = append(toKeep, role.ID)
				}
			}
		}
	}

	return toKeep, nil
}

func importRoleMappings(db *gorm.DB, users []ConfigUserMapping, groups []ConfigGroupMapping) error {
	// TODO: use a Set here instead of a Slice
	toKeep := make([]uuid.UUID, 0)

	ids, err := importUserRoleMappings(db, users)
	if err != nil {
		return err
	}

	toKeep = append(toKeep, ids...)

	ids, err = importGroupRoleMappings(db, groups)
	if err != nil {
		return err
	}

	toKeep = append(toKeep, ids...)

	// explicitly query using ID field
	if err := data.DeleteRoles(db, db.Not(toKeep)); err != nil {
		return err
	}

	return nil
}

// importSecretsConfig imports only the secret providers found in a config file
func (r *Registry) importSecretsConfig(bs []byte) error {
	var config Config
	if err := yaml.Unmarshal(bs, &config); err != nil {
		return err
	}

	if err := validate.Struct(config); err != nil {
		return fmt.Errorf("invalid config: %w", err)
	}

	if err := r.configureSecrets(config); err != nil {
		return fmt.Errorf("secrets config: %w", err)
	}

	return nil
}

// importConfig tries to import all valid fields in a config file and removes old config
func (r *Registry) importConfig(bs []byte) error {
	var config Config
	if err := yaml.Unmarshal(bs, &config); err != nil {
		return err
	}

	if err := validate.Struct(config); err != nil {
		return fmt.Errorf("invalid config: %w", err)
	}

	r.config = config

	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := importProviders(tx, config.Providers); err != nil {
			return err
		}

		if err := importRoleMappings(tx, config.Users, config.Groups); err != nil {
			return err
		}

		return nil
	})
}

func (r *Registry) importAPIKeys() error {
	type key struct {
		Secret      string
		Permissions []string
	}

	keys := map[string]key{
		"root": {
			Secret: r.options.RootAPIKey,
			Permissions: []string{
				string(access.PermissionAllAlternate),
			},
		},
		"engine": {
			Secret: r.options.EngineAPIKey,
			Permissions: []string{
				string(access.PermissionRoleRead),
				string(access.PermissionDestinationCreate),
			},
		},
	}

	for k, v := range keys {
		secret, err := r.GetSecret(v.Secret)
		if err != nil {
			return err
		}

		apiKey := &models.APIKey{
			Name:        k,
			Permissions: strings.Join(v.Permissions, " "),
			Key:         secret,
		}

		if _, err = data.CreateAPIKey(r.db, apiKey); err != nil {
			return err
		}
	}

	return nil
}

var baseSecretStorageKinds = []string{
	"env",
	"file",
	"plaintext",
	"kubernetes",
}

func isABaseSecretStorageKind(s string) bool {
	for _, item := range baseSecretStorageKinds {
		if item == s {
			return true
		}
	}

	return false
}

func (r *Registry) configureSecrets(config Config) error {
	if r.secrets == nil {
		r.secrets = map[string]secrets.SecretStorage{}
	}

	loadSecretConfig := func(secret ConfigSecretProvider) (err error) {
		name := secret.Name
		if len(name) == 0 {
			name = secret.Kind
		}

		if _, found := r.secrets[name]; found {
			return fmt.Errorf("duplicate secret configuration for %q, please provide a unique name for this secret configuration", name)
		}

		switch secret.Kind {
		case "vault":
			cfg, ok := secret.Config.(secrets.VaultConfig)
			if !ok {
				return fmt.Errorf("expected secret config to be VaultConfig, but was %t", secret.Config)
			}

			cfg.Token, err = r.GetSecret(cfg.Token)
			if err != nil {
				return err
			}

			vault, err := secrets.NewVaultSecretProviderFromConfig(cfg)
			if err != nil {
				return fmt.Errorf("creating vault provider: %w", err)
			}

			r.secrets[name] = vault
		case "awsssm":
			cfg, ok := secret.Config.(secrets.AWSSSMConfig)
			if !ok {
				return fmt.Errorf("expected secret config to be AWSSSMConfig, but was %t", secret.Config)
			}

			cfg.AccessKeyID, err = r.GetSecret(cfg.AccessKeyID)
			if err != nil {
				return err
			}

			cfg.SecretAccessKey, err = r.GetSecret(cfg.SecretAccessKey)
			if err != nil {
				return err
			}

			ssm, err := secrets.NewAWSSSMSecretProviderFromConfig(cfg)
			if err != nil {
				return fmt.Errorf("creating aws ssm: %w", err)
			}

			r.secrets[name] = ssm
		case "awssecretsmanager":
			cfg, ok := secret.Config.(secrets.AWSSecretsManagerConfig)
			if !ok {
				return fmt.Errorf("expected secret config to be AWSSecretsManagerConfig, but was %t", secret.Config)
			}

			cfg.AccessKeyID, err = r.GetSecret(cfg.AccessKeyID)
			if err != nil {
				return err
			}

			cfg.SecretAccessKey, err = r.GetSecret(cfg.SecretAccessKey)
			if err != nil {
				return err
			}

			sm, err := secrets.NewAWSSecretsManagerFromConfig(cfg)
			if err != nil {
				return fmt.Errorf("creating aws sm: %w", err)
			}

			r.secrets[name] = sm
		case "kubernetes":
			cfg, ok := secret.Config.(secrets.KubernetesConfig)
			if !ok {
				return fmt.Errorf("expected secret config to be KubernetesConfig, but was %t", secret.Config)
			}

			k8s, err := secrets.NewKubernetesSecretProviderFromConfig(cfg)
			if err != nil {
				return fmt.Errorf("creating k8s secret provider: %w", err)
			}

			r.secrets[name] = k8s
		case "env":
			cfg, ok := secret.Config.(secrets.GenericConfig)
			if !ok {
				return fmt.Errorf("expected secret config to be GenericConfig, but was %t", secret.Config)
			}

			f := secrets.NewEnvSecretProviderFromConfig(cfg)
			r.secrets[name] = f
		case "file":
			cfg, ok := secret.Config.(secrets.FileConfig)
			if !ok {
				return fmt.Errorf("expected secret config to be FileConfig, but was %t", secret.Config)
			}

			f := secrets.NewFileSecretProviderFromConfig(cfg)
			r.secrets[name] = f
		case "plaintext", "":
			cfg, ok := secret.Config.(secrets.GenericConfig)
			if !ok {
				return fmt.Errorf("expected secret config to be GenericConfig, but was %t", secret.Config)
			}

			f := secrets.NewPlainSecretProviderFromConfig(cfg)
			r.secrets[name] = f
		default:
			return fmt.Errorf("unknown secret provider type %q", secret.Kind)
		}

		return nil
	}

	// check all base types first
	for _, secret := range config.Secrets {
		if !isABaseSecretStorageKind(secret.Kind) {
			continue
		}

		if err := loadSecretConfig(secret); err != nil {
			return err
		}
	}

	if err := r.loadDefaultSecretConfig(); err != nil {
		return err
	}

	// now load non-base types which might depend on them.
	for _, secret := range config.Secrets {
		if isABaseSecretStorageKind(secret.Kind) {
			continue
		}

		if err := loadSecretConfig(secret); err != nil {
			return err
		}
	}

	return nil
}

// loadDefaultSecretConfig loads configuration for types that should be available,
// assuming the user didn't override the configuration for them.
func (r *Registry) loadDefaultSecretConfig() error {
	// set up the default supported types
	if _, found := r.secrets["env"]; !found {
		f := secrets.NewEnvSecretProviderFromConfig(secrets.GenericConfig{})
		r.secrets["env"] = f
	}

	if _, found := r.secrets["file"]; !found {
		f := secrets.NewFileSecretProviderFromConfig(secrets.FileConfig{})
		r.secrets["file"] = f
	}

	if _, found := r.secrets["plaintext"]; !found {
		f := secrets.NewPlainSecretProviderFromConfig(secrets.GenericConfig{})
		r.secrets["plaintext"] = f
	}

	if _, found := r.secrets["kubernetes"]; !found {
		// only setup k8s automatically if KUBERNETES_SERVICE_HOST is defined; ie, we are in the cluster.
		if _, ok := os.LookupEnv("KUBERNETES_SERVICE_HOST"); ok {
			k8s, err := secrets.NewKubernetesSecretProviderFromConfig(secrets.NewKubernetesConfig())
			if err != nil {
				return fmt.Errorf("creating k8s secret provider: %w", err)
			}

			r.secrets["kubernetes"] = k8s
		}
	}

	return nil
}

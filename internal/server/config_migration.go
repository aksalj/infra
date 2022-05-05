package server

type ConfigBase struct {
	Version string `mapstructure:"version"`
}

type ConfigV0dot1 struct {
	Providers  []Provider `mapstructure:"providers" validate:"dive"`
	Grants     []Grant    `mapstructure:"grants" validate:"dive"`
	Identities []User     `mapstructure:"identities" validate:"dive"`
}

// ToV0dot2 upgrades the 0.1 config to the 0.2 version
func (c ConfigV0dot1) ToV0dot2() *Config {
	return &Config{
		Version:   "0.2",
		Providers: c.Providers,
		Grants:    c.Grants,
		Users:     c.Identities,
	}
}

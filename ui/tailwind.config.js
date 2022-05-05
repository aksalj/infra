function withOpacityValue(variable) {
  return ({ opacityValue }) => {
    if (opacityValue === undefined) {
      return `rgb(${variable})`
    }
    return `rgb(${variable} / ${opacityValue})`
  }
}

module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        black: '#0A0E12',
        pink: {
          'light': withOpacityValue('228 64 255'),
          dark: '#CB2EEC'
        },
        gray: {
          300: '#B2B2B2',
          350: '#2A2D34',
          900: '#1C2027'
        },
        purple: {
          50: '#F4E2FF'
        }
      },
      fontSize: {
        note: ['10px', '12px'],
        name: ['12px', '15px'],
        icon: ['12px', '0px'],
        title: ['13px', '16px']
      },
      transitionProperty: {
        size: 'height, padding, background'
      },
      animation: {
        'spin-fast': 'spin 0.75s linear infinite'
      },
      fontFamily: {
        sans: ['SF Pro Text', 'BlinkMacSystemFont', 'Segoe UI', 'Ubuntu', 'sans-serif'],
        mono: ['SF Mono', 'monospace']
      }
    }
  }
}

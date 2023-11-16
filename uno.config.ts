import {
    defineConfig,
    presetIcons,
    presetTypography,
    presetUno,
    presetWebFonts,
  } from "unocss";
  export default defineConfig({
    presets: [
      presetUno(),
      presetWebFonts({
        provider: "fontshare",
        fonts: {
          sans: "Amulya",
          mono: ["Synonym"],
        },
      }),
      presetIcons(),
      presetTypography(),
    ],
    theme:{
      
        backgroundImage: {
          'dark-gradient': 'linear-gradient(to right, #1E1E1E, #000000, #1E1E1E)',
          'hero': "linear-gradient(0deg, rgba(41,57,69,0.4), #050505), url('https://turso.tech/pictures/background-isometric-grid.svg'),black",
          'hero-light': "linear-gradient(0deg, rgba(255,255,255,0.75), #fff), url('https://turso.tech/pictures/background-isometric-grid.svg'),white",
          'footer':"linear-gradient(3deg, hsl(220, 10%, 3.9%) 50%, hsl(220, 10%, 3.9%) 66%, hsl(220, 10%, 3.9%) 77%, transparent 100%),linear-gradient(225deg, rgba(59, 131, 199, 0) 44.51%, rgba(59, 131, 199, .17) 75.5%, rgba(49, 120, 198, .3) 100%), url(https://www.typehero.dev/_next/static/media/background_pattern.1cd1f555.webp)",
          'footer-light': 'linear-gradient(3deg,hsl(220, 10%, 93.9%) 50%,hsl(220, 10%, 93.9%) 66%,hsl(220, 10%, 93.9%) 77%,transparent 100%),linear-gradient(225deg,rgba(59, 131, 199, 0) 44.51%,rgba(59, 131, 199, 0.17) 75.5%,rgba(49, 120, 198, 0.3) 100%),url("https://www.typehero.dev/_next/static/media/background_pattern.1cd1f555.webp");'
        },
        backgroundSize: {
          '2200': '2200px',
          'dark': '2200px'
        },
        backgroundPosition: {
          'x-50': '50% 10%',
          'x-dark': '50% 0%'
        }
    },
    rules: [
      [/^bg-(.*)$/, ([, c], { theme }) => {
        let styles = {};
        
        if (theme.backgroundImage[c]) {
          styles = { ...styles, background: theme.backgroundImage[c] };
        }
        
        if (theme.backgroundSize[c]) {
          styles = { ...styles, 'background-size': theme.backgroundSize[c] };
        }
        
        if (theme.backgroundPosition[c]) {
          styles = { ...styles, 'background-position': theme.backgroundPosition[c] };
        }
        
        return styles;
      }]
    ],
  });
  
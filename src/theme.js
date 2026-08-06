// meishi.shop, carried into an app.
// Five colours, two faces, one red line.
// Indigo bands top and bottom hem every screen the way the denim is hemmed.

import { useColorScheme } from 'react-native';

export const palette = {
  indigo: '#22304a', // raw denim, dark
  cotton: '#f2eee4', // unbleached cotton, light
  selvedge: '#a13d36', // the red edge thread, dull brick
  steel: '#878c91', // brushed stainless
  ply: '#cbaf82', // birch
};

const light = {
  bg: palette.cotton,
  ink: palette.indigo,
  band: palette.indigo,
  accent: palette.selvedge,
  line: '#d5d0c4', // ink 16% into bg
  tint: '#e8e4d8', // ink 5% into bg
  cotton: palette.cotton,
  ply: palette.ply,
  steel: palette.steel,
  faded: '#67707f', // ink 55% into bg
};

// dark mode: the same cloth after sundown. paper becomes deep indigo
// night, ink becomes cotton, the band holds, the red thread brightens
// a step so it still reads. follows the device setting.
const dark = {
  bg: '#151b28',
  ink: '#ede9dd',
  band: '#1d2942',
  accent: '#c2544a',
  line: '#383c45',
  tint: '#202531',
  cotton: palette.cotton,
  ply: palette.ply,
  steel: palette.steel,
  faded: '#8d8f94',
};

export function useTheme() {
  return useColorScheme() === 'dark' ? dark : light;
}

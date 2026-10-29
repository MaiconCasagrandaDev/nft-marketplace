const EXT = "png" // confira a extensão real dos arquivos em public/nfts
const img = (name: string) => `/nfts/${name}.${EXT}`

export const images = {
  greenApe: img("green-ape"),
  blackApe: img("black-ape"),
  purpleApe: img("purple-ape"),
  orangeApe: img("orange-ape"),
}
export type PageTitleOptions = {
  language: string
  pageName: string
  homepage?: boolean
}

export function buildPageTitle({ language, pageName, homepage = false }: PageTitleOptions): string {
  const isChinese = language.toLowerCase().startsWith('zh')
  const brand = isChinese ? '智能工具矩阵' : 'Smart Tool Matrix'
  const separator = isChinese ? '｜' : ' | '

  return homepage
    ? `${brand}${separator}${pageName}`
    : `${pageName}${separator}${brand}`
}

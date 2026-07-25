import {
  Sparkles, FileText, Image, Code2,
  SearchCheck, type LucideIcon,
} from 'lucide-react'

const DIVINATION_TOOLS_URL = import.meta.env.DEV
  ? import.meta.env.VITE_DIVINATION_TOOLS_URL || 'http://localhost:5174/divination/'
  : '/divination/'

export interface Tool {
  id: string
  category: string
  icon: LucideIcon
  type: 'internal' | 'external'
  route?: string
  subToolCount?: number
}

export interface ToolCategory {
  key: string
  tools: Tool[]
}

export const TOOLS: Tool[] = [
  { id: 'divination_tools', category: 'divination', icon: Sparkles, type: 'external', route: DIVINATION_TOOLS_URL, subToolCount: 7 },
  { id: 'pdf_tools', category: 'document', icon: FileText, type: 'external', route: '/pdf/', subToolCount: 12 },
  { id: 'image_tools', category: 'image', icon: Image, type: 'external', route: '/image/', subToolCount: 8 },
  { id: 'developer_tools', category: 'developer', icon: Code2, type: 'external', route: '/developer/', subToolCount: 15 },
  { id: 'seo_tools', category: 'seo', icon: SearchCheck, type: 'external', route: '/seo/', subToolCount: 6 },
]

export function getToolsByCategory(): ToolCategory[] {
  const categoryMap = new Map<string, Tool[]>()
  for (const tool of TOOLS) {
    const list = categoryMap.get(tool.category) || []
    list.push(tool)
    categoryMap.set(tool.category, list)
  }
  return Array.from(categoryMap.entries()).map(([key, tools]) => ({ key, tools }))
}

export function getToolById(id: string): Tool | undefined {
  return TOOLS.find(t => t.id === id)
}

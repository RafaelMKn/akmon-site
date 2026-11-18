import { ChevronRight, File, Folder, FolderOpen } from 'lucide-react'
import { AnimatePresence, motion, useIsPresent, useReducedMotion, type Variants } from 'motion/react'
import { useId, useState, type ReactNode } from 'react'

export type TreeNode = {
  id: string
  name: string
} & ({ children: TreeNode[]; href?: never } | { href: string; children?: never })

type TreeViewProps = {
  data: TreeNode[]
  defaultExpandedIds?: string[]
}

const variants: Variants = {
  hidden: { opacity: 0, height: 0 },
  visible: {
    opacity: 1, height: 'auto',
    transition: { height: { type: 'spring', bounce: 0, duration: 0.35 }, opacity: { duration: 0.2 } },
  },
  exit: { opacity: 0, height: 0, transition: { duration: 0.18 } },
}

const row = 'flex min-h-11 w-full min-w-0 items-center gap-2 py-2 pr-2 text-left leading-snug hover:bg-papel/10 focus-visible:-outline-offset-2 focus-visible:outline-brasa-viva'
const label = 'min-w-0 [overflow-wrap:anywhere]'

export function TreeView({ data, defaultExpandedIds = [] }: TreeViewProps) {
  const [expandedIds, setExpandedIds] = useState(() => new Set(defaultExpandedIds))
  const reduced = useReducedMotion()

  function toggle(id: string) {
    setExpandedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <ul aria-label="Pastas e arquivos" className="m-0 list-none p-0 font-mono text-xs sm:text-sm">
      {data.map((node) => (
        <TreeItem key={node.id} node={node} expandedIds={expandedIds} toggle={toggle} reduced={Boolean(reduced)} />
      ))}
    </ul>
  )
}

function AnimatedChildren({ children }: { children: ReactNode }) {
  const present = useIsPresent()
  return (
    <motion.ul variants={variants} initial="hidden" animate="visible" exit="exit"
      inert={!present} className="m-0 list-none overflow-hidden p-0">
      {children}
    </motion.ul>
  )
}

type TreeItemProps = {
  node: TreeNode
  expandedIds: Set<string>
  toggle: (id: string) => void
  reduced: boolean
}

function TreeItem({ node, expandedIds, toggle, reduced }: TreeItemProps) {
  const groupId = useId()

  if (!node.children) {
    return (
      <li>
        <a href={node.href} className={`${row} pl-5 text-aco-claro hover:text-papel sm:pl-6`}>
          <File size={14} aria-hidden="true" className="shrink-0" />
          <span className={`${label} underline-offset-4 hover:underline`}>{node.name}</span>
        </a>
      </li>
    )
  }

  const expanded = expandedIds.has(node.id)
  const IconePasta = expanded ? FolderOpen : Folder
  const filhos = expanded && node.children.map((child) => (
    <TreeItem key={child.id} node={child} expandedIds={expandedIds} toggle={toggle} reduced={reduced} />
  ))

  return (
    <li>
      <button type="button" aria-expanded={expanded} aria-controls={groupId}
        onClick={() => toggle(node.id)} className={`${row} cursor-pointer pl-1.5 aria-expanded:bg-papel/5 sm:pl-2`}>
        <motion.span aria-hidden="true" className="flex shrink-0 text-aco-claro"
          initial={false} animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: reduced ? 0 : 0.16 }}>
          <ChevronRight size={14} />
        </motion.span>
        <IconePasta size={16} aria-hidden="true" className="shrink-0 text-brasa-viva" />
        <span className={label}>{node.name}</span>
      </button>
      <div id={groupId} className="ml-3 border-l border-aco/45 sm:ml-4">
        {reduced ? (
          expanded && <ul className="m-0 list-none p-0">{filhos}</ul>
        ) : (
          <AnimatePresence initial={false}>
            {expanded && <AnimatedChildren>{filhos}</AnimatedChildren>}
          </AnimatePresence>
        )}
      </div>
    </li>
  )
}

import { ChevronRight, Folder, FolderOpen } from 'lucide-react'
import { AnimatePresence, motion, useIsPresent, useReducedMotion, type Variants } from 'motion/react'
import { useId, useState, type ReactNode } from 'react'

export type TreeNode = {
  id: string
  name: string
} & (
  | { children: TreeNode[]; moreChildren?: TreeNode[]; content?: never }
  | { content: ReactNode; children?: never; moreChildren?: never }
)

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
    <ul aria-label="Categorias e skills" className="m-0 list-none p-0 font-mono text-xs sm:text-sm">
      {data.map((node) => (
        <TreeItem key={node.id} node={node} expandedIds={expandedIds} toggle={toggle} reduced={Boolean(reduced)} />
      ))}
    </ul>
  )
}

function AnimatedChildren({ children }: { children: ReactNode }) {
  const present = useIsPresent()
  return (
    <motion.div variants={variants} initial="hidden" animate="visible" exit="exit"
      inert={!present} className="overflow-hidden">
      {children}
    </motion.div>
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
  const [showMore, setShowMore] = useState(false)
  const expanded = expandedIds.has(node.id)
  const IconePasta = expanded ? FolderOpen : Folder
  const renderChild = (child: TreeNode) => (
    <TreeItem key={child.id} node={child} expandedIds={expandedIds} toggle={toggle} reduced={reduced} />
  )
  const content = expanded && (node.children ? (
    <ul className="m-0 list-none p-0">
      {node.children.map(renderChild)}
      {!!node.moreChildren?.length && (
        <li>
          <button type="button" aria-expanded={showMore} onClick={() => setShowMore((current) => !current)}
            className="min-h-11 cursor-pointer px-3 text-left text-brasa-viva underline-offset-4 hover:underline focus-visible:outline-brasa-viva">
            {showMore ? 'Ver só os destaques' : 'Ver todas as skills'}
          </button>
        </li>
      )}
      {showMore && node.moreChildren?.map(renderChild)}
    </ul>
  ) : node.content)

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
        {reduced ? content : (
          <AnimatePresence initial={false}>
            {expanded && <AnimatedChildren>{content}</AnimatedChildren>}
          </AnimatePresence>
        )}
      </div>
    </li>
  )
}

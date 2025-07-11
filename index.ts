function debounce<T extends (...args: any[]) => any>(func: T, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>): void => {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => func(...args), waitFor)
  }
}

function createProgressBar(completed: number, total: number): HTMLElement {
  const container = document.createElement('div')
  container.className = 'progress-bar-module__containerSegmented--IwcYh milestone-progress-bar'
  container.style.marginLeft = '8px'
  container.style.minWidth = '120px'
  container.style.display = 'flex'
  container.style.alignItems = 'center'
  container.style.flex = '1 1 auto'

  const SEGMENTED_THRESHOLD = 10

  if (total > SEGMENTED_THRESHOLD) {
    const continuousBar = document.createElement('div')
    continuousBar.className = 'prc-ProgressBar-ProgressBarContainer-E-z8S'
    continuousBar.style.width = '100%'
    continuousBar.style.height = '8px'
    continuousBar.style.backgroundColor = 'var(--bgColor-neutral-muted)'
    continuousBar.style.borderRadius = 'var(--borderRadius-small, 3px)'
    continuousBar.style.overflow = 'hidden'

    const barFill = document.createElement('div')
    const progressPercentage = total > 0 ? (completed / total) * 100 : 0
    barFill.style.height = '100%'
    barFill.style.width = `${progressPercentage}%`
    barFill.style.backgroundColor = 'var(--bgColor-success-emphasis)'
    barFill.style.transition = 'width 0.2s ease-in-out'

    continuousBar.appendChild(barFill)
    container.appendChild(continuousBar)
  }
  else {
    const segmentedBar = document.createElement('span')
    segmentedBar.className = 'progress-bar-module__segmented--MfASq prc-ProgressBar-ProgressBarContainer-E-z8S'
    segmentedBar.setAttribute('data-progress-display', 'inline')
    segmentedBar.setAttribute('data-progress-bar-size', 'default')

    segmentedBar.style.display = 'flex'
    segmentedBar.style.width = '100%'
    segmentedBar.style.gap = '2px'

    for (let i = 0; i < total; i++) {
      const barItem = document.createElement('span')
      barItem.className = 'progress-bar-module__barItem--Aj2mo prc-ProgressBar-ProgressBarItem-stL6O'
      barItem.style.flex = '1'
      barItem.style.height = '8px'
      barItem.style.backgroundColor = 'var(--bgColor-neutral-muted)'

      const radius = 'var(--borderRadius-small, 3px)'
      if (i === 0) {
        barItem.style.borderTopLeftRadius = radius
        barItem.style.borderBottomLeftRadius = radius
      }
      if (i === total - 1) {
        barItem.style.borderTopRightRadius = radius
        barItem.style.borderBottomRightRadius = radius
      }

      if (i < completed) {
        barItem.classList.add('progress-bar-module__barItemComplete--Ro6h2')
        barItem.style.backgroundColor = 'var(--bgColor-success-emphasis)'
      }
      segmentedBar.appendChild(barItem)
    }
    container.appendChild(segmentedBar)
  }

  const percentage = document.createElement('span')
  percentage.className = 'progress-bar-module__textPercentage--pzQK8'
  percentage.textContent = total > 0 ? `${Math.round((completed / total) * 100)}%` : '0%'
  percentage.style.paddingLeft = '8px'
  percentage.style.whiteSpace = 'nowrap'

  container.appendChild(percentage)

  return container
}

let observer: MutationObserver
const milestoneIssuesStateCache = new Map<string, Map<string, boolean>>()

function addProgressBars() {
  observer.disconnect()

  const groupHeaders = document.querySelectorAll('div.table-group-module__Box--F3vEc')

  groupHeaders.forEach((header) => {
    const titleContainer = header.querySelector<HTMLElement>('.hYSjTM')
    if (!titleContainer)
      return

    const milestoneTitle = titleContainer.textContent?.trim() ?? ''
    if (!milestoneIssuesStateCache.has(milestoneTitle))
      milestoneIssuesStateCache.set(milestoneTitle, new Map<string, boolean>())

    const issuesStateForMilestone = milestoneIssuesStateCache.get(milestoneTitle)!

    const counter = header.querySelector<HTMLElement>('span.prc-CounterLabel-CounterLabel-ZwXPe')
    const realTotalEl = counter?.nextElementSibling

    if (!counter || !realTotalEl || !realTotalEl.textContent)
      return

    const totalMatch = realTotalEl.textContent.match(/\d+/)
    if (!totalMatch)
      return

    const totalIssues = Number.parseInt(totalMatch[0], 10)

    const rowGroup = header.closest('[role="rowgroup"]')
    if (!rowGroup)
      return

    if (totalIssues === 0) {
      const existingBar = header.querySelector('.milestone-progress-bar')
      if (existingBar)
        existingBar.remove()

      counter.textContent = '0'
      return
    }

    const issueRows = rowGroup.querySelectorAll('[role="row"][data-hovercard-subject-tag^="issue:"]')
    issueRows.forEach((row) => {
      const issueId = row.getAttribute('data-hovercard-subject-tag')
      if (!issueId)
        return

      const isClosed = !!row.querySelector('svg.octicon-issue-closed, svg[aria-label^="Closed"]')
      issuesStateForMilestone.set(issueId, isClosed)
    })

    const completedIssues = [...issuesStateForMilestone.values()].filter(isClosed => isClosed).length

    titleContainer.style.flexShrink = '0'

    const parent = titleContainer.parentElement
    if (!parent)
      return

    parent.querySelector('.milestone-progress-bar')?.remove()

    const progressBar = createProgressBar(completedIssues, totalIssues)

    titleContainer.after(progressBar)

    counter.textContent = `${completedIssues} / ${totalIssues}`
    counter.style.whiteSpace = 'nowrap'
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })
}

const debouncedAddProgressBars = debounce(addProgressBars, 200)

observer = new MutationObserver(() => {
  debouncedAddProgressBars()
})

observer.observe(document.body, {
  childList: true,
  subtree: true,
})

debouncedAddProgressBars()

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
  // These class names are based on GitHub's internal CSS and might change.
  container.className = 'progress-bar-module__containerSegmented--IwcYh milestone-progress-bar'
  container.style.marginLeft = '8px'
  // Using flex properties gives us more control over the layout and
  // prevents the progress bar from pushing the title too much.
  container.style.flex = '0 1 120px'

  const segmentedBar = document.createElement('span')
  segmentedBar.className = 'progress-bar-module__segmented--MfASq prc-ProgressBar-ProgressBarContainer-E-z8S'
  segmentedBar.setAttribute('data-progress-display', 'inline')
  segmentedBar.setAttribute('data-progress-bar-size', 'default')

  for (let i = 0; i < total; i++) {
    const barItem = document.createElement('span')
    barItem.className = 'progress-bar-module__barItem--Aj2mo prc-ProgressBar-ProgressBarItem-stL6O'
    if (i < completed) {
      barItem.classList.add('progress-bar-module__barItemComplete--Ro6h2')
    }
    segmentedBar.appendChild(barItem)
  }

  const percentage = document.createElement('span')
  percentage.className = 'progress-bar-module__textPercentage--pzQK8'
  percentage.textContent = total > 0 ? `${Math.round((completed / total) * 100)}%` : '0%'

  container.appendChild(segmentedBar)
  container.appendChild(percentage)

  return container
}

// Declare observer so it's in scope for addProgressBars
let observer: MutationObserver

function addProgressBars() {
  // Disconnect the observer while we modify the DOM to prevent infinite loops.
  observer.disconnect()

  console.log('[M-P] Running addProgressBars...')
  const groupHeaders = document.querySelectorAll('div.table-group-module__Box--F3vEc')

  if (groupHeaders.length > 0) {
    console.log(`[M-P] Found ${groupHeaders.length} milestone group headers.`)
  }

  groupHeaders.forEach((header, index) => {
    const rowGroup = header.closest('[role="rowgroup"]')
    if (!rowGroup)
      return

    const issueRows = rowGroup.querySelectorAll('[role="row"][data-hovercard-subject-tag^="issue:"]')
    if (issueRows.length === 0) {
      const existingBar = header.querySelector('.milestone-progress-bar')
      if (existingBar) {
        console.log(`[M-P] Group ${index}: No issues found, removing existing bar.`)
        existingBar.remove()
      }
      return
    }

    const totalIssues = issueRows.length
    let completedIssues = 0

    issueRows.forEach((row) => {
      // Determine completion via closed icon in title cell
      const closedIcon = row.querySelector('svg.octicon-issue-closed, svg[aria-label^="Closed"]')
      if (closedIcon) {
        completedIssues++
      }
    })

    console.log(`[M-P] Group ${index}: ${completedIssues}/${totalIssues} completed.`)

    const injectionPoint = header.querySelector('.hYSjTM')
    if (!injectionPoint)
      return

    const existingBar = injectionPoint.querySelector('.milestone-progress-bar')
    if (existingBar) {
      existingBar.remove()
    }

    const progressBar = createProgressBar(completedIssues, totalIssues)
    injectionPoint.appendChild(progressBar)
    console.log(`[M-P] Injected/updated progress bar for group ${index}.`)

    const counter = header.querySelector('span.prc-CounterLabel-CounterLabel-ZwXPe') as HTMLElement | null
    if (counter) {
      // Preserve the original total once so we don't keep prefixing our "x /" part on every refresh.
      let originalTotal = counter.dataset.originalTotal
      if (!originalTotal) {
        originalTotal = counter.textContent?.trim() ?? ''
        counter.dataset.originalTotal = originalTotal
      }

      counter.textContent = `${completedIssues} / ${originalTotal}`
      // Ensure the pill doesn't wrap onto multiple lines when the numerator grows.
      counter.style.whiteSpace = 'nowrap'
    }
  })

  // Reconnect the observer once we're done.
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })
}

const debouncedAddProgressBars = debounce(addProgressBars, 200)

// Initialize observer now that its dependencies are defined
observer = new MutationObserver(() => {
  debouncedAddProgressBars()
})

// Start observing the document body for changes
observer.observe(document.body, {
  childList: true,
  subtree: true,
})

// Initial run
debouncedAddProgressBars()

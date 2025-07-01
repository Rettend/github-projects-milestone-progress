# PLAN

## **Project Goal**

To create a browser extension that displays a progress bar for each milestone group in a GitHub Project view. The progress bar will be visually identical to the existing "sub-issue" progress bar and will show the ratio and percentage of completed issues to the total number of issues in that milestone.

---

### **Plan of Attack**

The plan is broken down into logical steps, from identifying the necessary elements to dynamically updating them as the page content changes.

#### **Step 1: Scaffolding and Manifest Configuration**

The primary task here is to set up the extension to run a content script on the correct GitHub pages.

* **`manifest.json`:**
  * Define `content_scripts`. This tells the browser to inject our JavaScript file into specific web pages.
  * The `matches` pattern should be `https://github.com/*/*/projects/*`. This ensures the script only runs on GitHub project pages.
  * The `js` key will point to the compiled output of `index.ts` (e.g., `dist/index.js`).

#### **Step 2: Detecting and Processing Milestone Groups**

Since GitHub Projects is a dynamic single-page application (SPA), we cannot simply run our code once on page load. We must continuously watch for changes to the DOM.

* **Use `MutationObserver`:** This is the ideal tool for this scenario. We'll create an observer that watches the main content area of the project board for any changes (e.g., adding/removing issues, changing the "Group by" field, collapsing/expanding groups).
* **Identify Group Headers:** Within the observer's callback, our first task is to find all the milestone group headers. Based on the provided HTML, a good selector would be `div.table-group-module__Box--F3vEc`. This selects the container for the group's title row.
* **Run on Interval/Debounce:** The `MutationObserver` might fire very frequently. To optimize performance, we'll wrap our main logic in a debounced function. This means the logic will only run after a short period of inactivity (e.g., 200ms), preventing it from running multiple times for a single user action.

#### **Step 3: Calculating Progress for Each Milestone**

For each group header found in Step 2, we need to calculate its progress.

* **Iterate Through Groups:** Loop over each group header element.
* **Find Associated Rows:** For a given group header, we need to find all the issue rows that belong to it. The HTML shows that the header and its rows are contained within a `div[role="rowgroup"]`. We can traverse the DOM from the header to find this parent `rowgroup` and then select all issue rows within it. A selector for an issue row looks like `div[role="row"].table-row__StyledTableRow-sc-cd5a679a-0`.
* **Determine Issue Status:** For each issue row, we must find its "Status" and check if it's considered "Done".
  * **Find the Status Cell:** We need a robust selector for the status cell. A good candidate is a `div[role="gridcell"]` that contains a `span` with the class `single-select-token-module__SingleSelectToken--DTmpZ`.
  * **Check for Completion:** Inside that cell, we can find the `span.prc-Text-Text-0ima0` and check if its `textContent` is "Done" or "Completed". A more robust method would be to check the parent token's style for a success color (e.g., a CSS variable like `--bgColor-success-muted`), as status names can be customized by users.
* **Count:**
  * `totalIssues` = The total number of issue rows found in the group.
  * `completedIssues` = The count of rows where the status is "Done".

#### **Step 4: Creating and Injecting the Progress Bar**

This is where we build the UI element and add it to the page.

* **Avoid Duplication:** Before adding a new progress bar, we'll check if we've already added one to this header. We can do this by adding a custom attribute like `data-milestone-progress-added="true"` to the header once we process it. If it exists, we'll update the existing progress bar instead of creating a new one.
* **Clone or Recreate:** We will recreate the HTML structure of the sub-issue progress bar using `document.createElement`. This gives us full control and ensures we use the exact class names for styling. The structure should be:
  * `<div class="progress-bar-module__containerSegmented--IwcYh ...">`
    * `<span class="progress-bar-module__textCount--FR2FW">` (e.g., "6 / 9")
    * `<span class="progress-bar-module__segmented--MfASq ...">`
      * This will contain `totalIssues` number of child `<span>`s.
      * The first `completedIssues` spans will have the class `progress-bar-module__barItemComplete--Ro6h2`.
      * The remaining spans will have the class for incomplete items (e.g., `progress-bar-module__barItemIncomplete--...` or just no completion class).
    * `<span class="progress-bar-module__textPercentage--pzQK8">` (e.g., "67%")
* **Find Injection Point:** The target location is inside the `div` that contains the milestone title and the item count. The selector for this is `div.hYSjTM`. We will append our newly created progress bar element to this `div`.
* **Apply Custom Styles:** We'll add a little custom CSS to make it fit nicely, perhaps some `margin-left` and ensuring `display: flex` and `align-items: center` on the parent container.

### **Execution Flow Summary**

1. **Extension Loads:** The content script is injected into a GitHub Project page.
2. **Observer Starts:** A `MutationObserver` is attached to the main project grid.
3. **DOM Changes:** The user loads the page, changes a filter, or updates an issue.
4. **Observer Fires:** The observer's callback is triggered.
5. **Logic Runs (Debounced):**
    a. Find all milestone group headers (`div.table-group-module__Box--F3vEc`).
    b. For each header:
        i. Check if it's already processed. If so, either update or skip.
        ii. Calculate `completedIssues` and `totalIssues` for the group.
        iii. Build the progress bar element with the correct data and classes.
        iv. Inject the progress bar next to the milestone title.
        v. Mark the header as processed.

# Putting Shara's Kitchen Online — Full Click-by-Click Guide
### (GitHub in the browser → your Android phone. No software to install.)

**Time:** about 20 minutes the first time.
**You need:** a computer with a web browser, the file `shara-kitchen.zip`, and your phone.

---

## STEP 0 — Unzip the file on your computer

1. Find **`shara-kitchen.zip`** (wherever you saved it — probably your Downloads folder).
2. **Right-click** it → **Extract All…** → **Extract**.
3. A normal folder named **`shara-kitchen`** appears. Open it.
4. Inside you should see files like `index.html`, `menu.html`, `sw.js`, and folders
   named `assets`, `kitchen-app`, `recipes`, `study-topics`, `cooking-tips`.
   Keep this window open — you'll drag from here later.

---

## STEP 1 — Make a free GitHub account (skip if you already have one)

1. Open a browser and go to **https://github.com**
2. Click **Sign up** (top-right).
3. Type your **email** → **Continue**. Create a **password** → **Continue**.
   Pick a **username** (e.g. `sharawang`) → **Continue**.
4. Solve the little puzzle, then click **Create account**.
5. GitHub emails you a code. Open your email, copy the code, paste it in. Done.
6. If it asks survey questions, you can pick anything or skip. Choose the **Free** plan.

---

## STEP 2 — Create an empty repository (your project's home)

1. At the **top-right**, click the **＋** icon → **New repository**.
2. Fill the form:
   - **Repository name:** type `shara-kitchen`
   - **Description:** optional (e.g. "My recipe app")
   - Choose **Public**  ← important; free hosting only works on Public repos
   - Leave **"Add a README file" UNCHECKED** (you already have one)
   - Leave everything else as-is
3. Click the green **Create repository** button.
4. You now land on a page titled **"Quick setup"**. Leave this page open — Step 3
   uses it.

---

## STEP 3 — Upload your files (done in TWO batches)

GitHub only accepts about 100 files per upload, and you have ~159, so you'll upload
in two batches. It's just drag-and-drop.

### Batch 1 — everything EXCEPT the `recipes` folder (63 files)

1. On the Quick-setup page, find the line that says
   *"…or push an existing repository / **uploading an existing file**"* and click
   the **uploading an existing file** link.
   *(If you don't see it: click **Add file** near the top → **Upload files**.)*
2. You'll see a big box that says **"Drag files here to add them to your repository"**.
3. Switch to your open **`shara-kitchen`** folder window.
4. Select **everything except the `recipes` folder**:
   - Press **Ctrl + A** to select all items.
   - Hold **Ctrl** and **click the `recipes` folder once** to un-highlight only it.
   - Now everything is highlighted except `recipes`.
5. **Drag** the highlighted items into the browser's upload box and drop them.
6. Wait — you'll see the file names fill in and a progress bar. This can take a
   minute. Let it finish (no more spinning).
7. Scroll to the bottom. In the **"Commit changes"** box, the message can stay as-is.
   Click the green **Commit changes** button.
8. You'll return to your repository page and now see your files and folders listed.

### Batch 2 — the `recipes` folder (96 files)

1. On your repository page, click **Add file** (top-right area) → **Upload files**.
2. Back in your `shara-kitchen` folder window, **drag just the `recipes` folder**
   into the upload box.
3. Wait for all files to finish uploading.
4. Scroll down → click **Commit changes**.
5. Done — every file is now on GitHub. Your repo should show `recipes`, `kitchen-app`,
   `assets`, `study-topics`, `cooking-tips`, and the loose files.

> If a dialog warns about uploading many files or hidden files, that's normal —
> continue. Files starting with a dot (like `.gitignore`) aren't required.

---

## STEP 4 — Turn on free hosting (GitHub Pages)

1. On your repository page, click the **Settings** tab (top row, far right; gear icon).
2. In the **left sidebar**, scroll down and click **Pages**
   (under the "Code and automation" group).
3. Under **"Build and deployment"** → **Source**, make sure it says
   **Deploy from a branch**.
4. Just below, under **Branch**, open the first dropdown (says "None") and choose
   **`main`**. Leave the folder dropdown as **`/ (root)`**.
5. Click **Save**.
6. Wait about **1 minute**, then **refresh the page**. A green banner appears:
   **"Your site is live at https://YOUR_USERNAME.github.io/shara-kitchen/"**
   *(YOUR_USERNAME is whatever you picked in Step 1.)*

---

## STEP 5 — Check it on your computer first

1. Your app's address is:
   **`https://YOUR_USERNAME.github.io/shara-kitchen/kitchen-app/`**
   (that's the site address from Step 4 with **`kitchen-app/`** added on the end).
2. Open it in your browser. You should see **Shara's Kitchen** with a search bar and
   the category tiles. Tap a tile, open a recipe — make sure it works.
   *(If you get "404", wait another minute and refresh — Pages can take a bit.)*

---

## STEP 6 — Put it on your Android phone

1. On your phone, open **Chrome** (not another browser, for the first install).
2. Type the app address from Step 5 into Chrome and go to it.
3. Tap the **⋮** menu (three dots, top-right).
4. Tap **Add to Home screen** (on some phones it says **Install app**).
5. Tap **Add** / **Install** to confirm.
6. Close Chrome and find the new **Shara's Kitchen** icon on your home screen.
   Open it — it runs fullscreen like a normal app.
7. While you have internet, open a handful of recipes once so they save for offline.
   After that, the app works even with no signal.

🎉 That's it — you now have your recipe app on your phone.

---

## Updating it later (all in the browser)

- **Edit a recipe or fix a typo:** on github.com, click into the file, click the
  **✏️ pencil** (top-right of the file), make changes, then **Commit changes** at
  the bottom. Your site updates in ~1 minute; the installed app refreshes next time
  you open it.
- **Add a brand-new recipe:** this also needs the app's index rebuilt
  (`python build-index.py`, which needs Python on a computer). Message me when you
  want to add one and I'll rebuild it for you and hand you the files to re-upload.

---

## If something goes wrong

- **"uploading an existing file" link is missing** → click **Add file → Upload files**
  instead. Same thing.
- **Upload seems stuck** → wait; large batches take a minute. If it fails, refresh and
  drag again (nothing breaks).
- **Chrome won't offer "Install"** → confirm you're on the **https://…github.io/…**
  address, not a file on your computer, and that the page fully loaded.
- **404 error on the app page** → double-check the address ends with **`/kitchen-app/`**,
  and that Pages (Step 4) shows Branch = `main`, Folder = `/ (root)`.
- **Stuck anywhere** → tell me exactly what the screen says and I'll get you unstuck.

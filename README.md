# Python Debug Lab

A polished, **fully working Python debugging demo website** with a VS Code-inspired dark developer workspace for practising programming-error detection and correction. Includes five programming topics, 25 intentionally buggy variants, an editable Python runner, unit tests, three graduated hint levels, a separate free-form Error Detective, and locally saved learning analytics.

**This is a coding-learning application, not a survey or research study.** It uses deterministic error guidance and reference solutions, not an external AI model. No API key, backend, registration, or database is required.

## Features

| Area | What works |
| --- | --- |
| Overview | Dashboard with algorithm progress, solved variants, recorded executions and pass rate |
| Debug playground | 5 topics × 5 distinct errors = 25 exercises with editable Python source |
| Run tests | Each challenge runs 4–6 Python test cases and displays actual versus expected results |
| Error explanation | Python exception classification and test-driven logic error explanation |
| Guided hints | Three levels: input/example → concept → detailed repair |
| Reference fix | Unlock and apply a verified reference implementation after running tests |
| Online Python Compiler | Edit your Python code; run it, supply any number of values via interactive `input()` prompts or multiline stdin, inspect output and errors |
| Analytics | Saved pass/fail attempts, per-topic progress chart, CSV export, clear history |
| Design | VS Code-inspired dark editor, file tabs, line numbers, cursor location, status bar, responsive desktop and mobile layout |
| Internationalization | English / 简体中文 / Монгол switcher in the header; saves preference in localStorage; translates lessons, hints, error guidance, and UI without altering Python source or console output |

## Language switching

Use the **Language** selector in the top-right corner to choose English, 中文, or Монгол. Your choice persists on this browser. User-written Python code, Python exception identifiers and raw stdout are not translated. 25 challenges, 71 unique hint strings, interface navigation, and rule-based explanations have three-language coverage.

## Run the site

The visual design uses a dark graphite desktop-workspace theme with tabs and Monaco-inspired code typography. Both the playground and compiler editors show synced line numbers, support Tab indentation and Ctrl/Cmd+Enter to run.

The project is a static website. It **must be served over HTTP** rather than opened directly as a `file://` page because it uses ES modules and a Web Worker.

```bash
git clone https://github.com/ch4rmont-ship-it/python-bugfix-research-demo.git
cd python-bugfix-research-demo
python -m http.server 5173
```

Open **http://localhost:5173**.

You can also deploy the repository to Vercel or GitHub Pages as a static site without changing the source.

**Important:** The first Python run needs internet access to download Pyodide 0.27.7 from jsDelivr CDN. After loading, Python executes in a browser Web Worker. Slow connections or blocked CDN access can prevent the runtime from starting.

## Automated tests

Requires Node.js 20+ and Python 3.9+:

```bash
npm test
```

CI also checks source syntax. Current test suite validates that every *reference solution* passes its supplied test cases and that each of the 25 deliberately buggy variants fails at least one case.

## Project structure

```text
index.html             Page layout and navigation
styles.css             Responsive interface
app.js                 Application views, state, progress, export, runtime integration
tasks.js               Five challenge topics and 25 buggy variants
solutions.js           Tested reference solutions
python-worker.js       Isolated Pyodide-powered Python execution
tests/                 Challenge consistency tests
.github/workflows/     Continuous integration test workflow
```

## Demo walkthrough

1. Open **Debug playground**, pick *Sum Positive Values*, and click **Run tests**. The deliberately wrong condition fails.
2. Click **Reveal next hint** one to three times to reveal progressively more specific guidance.
3. Edit the inequality (or click **Apply reference fix**) and run again to pass the tests.
4. Open **Python Compiler**. Click **Interactive loop demo**, then **Run Code**. Enter a count (such as `3`) and press Enter, then supply three numbers one at a time in the console. The final sum appears in output. Alternatively, fill **Optional Input Data (stdin)** with one input per line and click **Run Code** once. You can download the code as a `.py` file.
5. Open **Analytics** to see progress and download CSV.

## Privacy and limitations

- All practice records are saved in your own browser via `localStorage`; clearing site data loses them. Export CSV to preserve history.
- No code or progress is sent to an application backend. Loading the Python runtime requires requests to the CDN.
- Python runs inside a browser Worker and is terminated if execution times out. This is **not** a hardened multi-user server sandbox, and the app should not be used to execute untrusted code with sensitive browser data.
- Interactive `input()` support is implemented by **replaying the script from its beginning with all collected input values**, rather than pausing a native process. For deterministic coding examples, prompts and outputs behave as expected, but scripts with external side effects, random state, time-dependent behavior, or complex I/O may not behave like a full native Python process.
- Direct `sys.stdin.read()` and `sys.stdin.readline()` can consume the optional preloaded stdin, but do not dynamically request more values. Interactive input is supported for built-in `input()`; limit 100 input prompts per execution.
- Press **Ctrl+Enter** inside the editor to run; **Tab** inserts four spaces. **Stop** terminates a running script; **Clear** resets the console.
- Passing the provided tests does not prove correctness on all possible inputs. Free-form code execution can identify syntax/runtime errors but cannot verify arbitrary program intent without specifications and expected outputs.
- This is a functional demo of structured debugging assistance, not a live generative AI service.

Built for the USTB AI and Innovative Design coursework demo.


## Phase 1 — Monaco, custom tests, AI-ready debugger

### Monaco Editor

Both the challenge editor and free-form Python Compiler now attempt to load **Monaco Editor 0.52.2** on demand. It offers Python syntax highlighting, bracket matching, auto indentation, Ctrl/Cmd+Enter to run, and an improved editor experience. This static project uses the pinned legacy AMD distribution so it does not need a bundler. If jsDelivr is blocked or Monaco fails to initialize, the existing editable textarea remains operational. The first load requires internet access.

### Custom Test Cases

Open **Python Compiler → Custom Test Cases**. Add up to **10** input/expected-output examples and click **Run Custom Tests**. They are executed separately in Pyodide. Test output is compared exactly after normalizing platform line endings and ignoring trailing newlines. Unlike the interactive terminal, automated tests don't include `input()` prompts/echo in stdout.

Example Python code:

```python
A = int(input())
B = int(input())
print(A + B)
```

Test 1: **Input** `10` (newline) `20`; **Expected Output** `30`. Test 2: **Input** `-5` (newline) `8`; **Expected Output** `3`. The displayed test results include PASS/FAIL, actual output, and errors. Cases persist in your browser; no server is needed.

### AI Code Debugger

The **Analyze locally** button is available immediately, no token required. This *deterministic, rule-based* checker inspects common mistakes, Python exceptions, traceback line numbers, and failed custom tests. It is **not** a machine-learning model and cannot verify arbitrary programs for correctness.

An optional Vercel endpoint (`api/debug.js`) implements AI analysis using the OpenAI Responses API. By default it is **disabled**, so no code is sent to any model. To activate it later, configure the following **server-side Vercel environment variables** and redeploy:

- `OPENAI_API_KEY`: a private API key, never committed to GitHub or shipped to the browser.
- `AI_ENABLED=true`: explicit opt-in; absent by default.
- `AI_ALLOWED_ORIGIN=https://python-debug-lab.vercel.app`: optional allowed browser origin (this is not authentication).
- `OPENAI_MODEL=gpt-4.1-mini`: optional override of the default model.

Once configured, the **Analyze with AI** button activates and submits only the selected source plus short error/test context when clicked. The server sends a capped prompt to the model and does not request storage (`store:false`). **Before enabling AI on a public site, implement authentication plus durable rate limiting and abuse controls**, because origin checking alone cannot stop automated API abuse or prevent unexpected token charges. The current public site intentionally leaves AI disabled.

## On-demand Python input terminal

The **Python Compiler** initially displays only the source editor and a compact **Advanced: preload standard input (optional)** disclosure. Clicking **Run Code** automatically opens a VS Code-inspired **bottom terminal drawer**, which shows program stdout and any exception/traceback. If the program calls built-in `input()` without enough preloaded values, the terminal displays an inline input box and focuses it. Enter a value and press **Enter**; the program continues to the next prompt or prints its final output. Blank strings are valid input values.

The terminal's **×** button hides it without stopping an input session, and **Open Terminal** restores the same pending input/output. **■ Stop** cancels a running session; **Clear terminal** resets and hides the panel. `Ctrl/Cmd+Enter` inside Monaco/textarea opens the same terminal and runs the script. Quick examples deliberately leave optional stdin blank to demonstrate interactive entry. The advanced stdin field remains available for batch input and `sys.stdin.read()`.

**Implementation note:** the Pyodide Worker replays the source with collected input on each new prompt instead of suspending a native interactive process. Therefore this mechanism is appropriate for deterministic learning exercises, but not equivalent to a true persistent native Python process when the code has nondeterministic or external side effects.

Previous versions may have saved input in the browser. **Interactive terminal mode is now the default**, even if old stdin data exists. To feed batch data, expand **Advanced: preload standard input**, check **Use preloaded stdin**, and enter your lines; typing new data automatically enables batch mode. Click a quick example to return to interactive mode.

## Full Python Project Workspace (folder upload)

Navigate to **Project Workspace → Open Folder**. In Chrome or Edge, select an existing Python project directory using the browser folder picker. The importer preserves subfolders (including packages, source files, JSON, CSV, text, and small binary assets) and displays them in a VS Code-style Explorer. It deliberately excludes `.git`, virtual environments (`venv`, `.venv`), build caches, `node_modules`, and `.env` files.

- Click any text file to edit it with Monaco (or the fallback editor). Changes are automatically saved to **IndexedDB in this browser**, not uploaded to any server.
- Use **New File** to add a `.py` or other text file at a relative path such as `src/utils.py`.
- Choose a Python script in the **Entry file** dropdown; the importer preferentially selects `main.py`, `app.py`, or `run.py`.
- Click **Run Project**. Every uploaded file is temporarily mounted in the Pyodide virtual filesystem; Python imports like `from utils import greet`, package imports like `from src.utils import greet`, and file reads like `open('data/values.csv')` can work without modifying the source. The bottom terminal opens and asks for `input()` values when needed.
- Expand **Advanced: preloaded stdin** if you want to supply several lines of input before execution.
- **Close Project** removes the browser-stored working copy. Original files on your computer are not modified by editing inside the browser.

**Limits:** 250 files per project, 20 MB total, and 8 MB per file. Editing and runtime execution are browser-local. This is not a server-based Python environment: dependencies outside Pyodide's available libraries, native applications, background services, sockets, or OS-specific programs may not work. Writes created by the executing Python process live only in the temporary runtime and are not copied back into your project. Each interactive `input()` prompt replays the program with previously entered values. There is no direct host-disk access outside files explicitly chosen by the user.

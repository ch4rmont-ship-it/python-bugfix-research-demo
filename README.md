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


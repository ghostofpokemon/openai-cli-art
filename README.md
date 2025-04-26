## `gen.js` - Image gen in the CLI

*(Because clicking buttons is for plebs)*

So, you're back. Good. This thing lets you generate or edit images using OpenAI's *fancy* `gpt-image-1`, DALL·E 2 or DALL·E 3 from your command line. Runs on plain **Node.js** or **Bun** (Bun is faster but totally optional. Chage the shebang at the top from `#!/usr/bin/env node` to `#!/usr/bin/env bun`)

Generate, edit, make things transparent, choose your poison. It's pretty straightforward, but powerful enough to get weird with.

## Features

*   Generate images straight from your command line.
*   Edit existing images using masks (inpainting/outpainting vibes).
*   Supports `gpt-image-1`, `dall-e-2`, and `dall-e-3` models.
*   Control quality, size, format, and number of images via flags.
*   Optional image preview *directly in your terminal* if you're rockin' iTerm2 on macOS. Pretty slick, right?
*   Tells you roughly how much your digital dreams might cost (check your OpenAI dashboard for the real numbers, though).

### Prerequisites (The Annoying Stuff)

1.  **Runtime:** This baby now runs on **Node.js** (grab it: [https://nodejs.org/](https://nodejs.org/)) OR **Bun** if you want extra speed (grab it: [https://bun.sh/](https://bun.sh/)). Your choice. The shebang `#!/usr/bin/env bun` at the top *prefers* Bun if you run it directly (`./gen.js`), but `node gen.js` works fine too. Pick your speed demon.
2.  **OpenAI API Key:** this cost monies (gpt-image-1 'low' square images are $0.011 and 'high' portrait / landscape run $0.25). Get a key from OpenAI and set it as an environment variable. The script looks for `OPENAI_API_KEY`. Seriously, don't paste it into the script like an amateur.
    ```bash
    # In your .zshrc, .bashrc, .profile, wherever your shell uses
    export OPENAI_API_KEY='sk-YourSecretKeyIsProbablyNotThisSecure'
    # Then reload your shell or open a new terminal
    ```

### Setup (Making It Feel Like a Real Command)

Got the script (`gen.js`)? Good. Let's make it less of a chore to run.

1.  **Grant Execution Powers:**
    ```bash
    chmod +x gen.js
    ```
2.  **(Highly Recommended) Put it in Your PATH:**
    Symbolic link time. Needs `sudo` usually.
    ```bash
    # Make sure you\'re IN THE FOLDER where gen.js lives when you run this!
    sudo ln -s "$PWD/gen.js" /usr/local/bin/gen
    ```

    *   **Want a different name?** Change `gen` at the end to whatever floats your boat. `art`, `image-gen`, `painter`
        ```bash
        # Example: Call it 'art'
        sudo ln -s "$PWD/gen.js" /usr/local/bin/art
        ```
    Now you can summon art from anywhere.

### Usage

It's simple, really. Run the command, give it flags (see below), and then type your weird-ass prompt.

```bash
# Using the linked command 'gen'
gen "A photorealistic toaster oven contemplating the futility of existence"

# If you didn't link it, using Bun
bun run gen.js "Synthwave landscape made entirely of sentient gummy bears"

# Or using Node
node gen.js "A charcoal sketch of a dog wearing VR goggles, looking confused"
```

Any text that isn't a flag or its argument gets mashed together to become the prompt. Use quotes `"like this"` if your prompt has spaces.

### Flags - All The Levers You Can Pull

Here's the control panel. Defaults are shown. Mix and match 'em.

| Flag            | Alias | Description                                                                                                   | Default         | Example                                              |
| :-------------- | :---- | :------------------------------------------------------------------------------------------------------------ | :-------------- | :--------------------------------------------------- |
| `[PROMPT]`      |       | Your brilliant (or moronic) text prompt. Comes after all flags.                                               | `"Ghibli it"`   | `gen "A cat discovering fire"`                       |
| `--model`       | `-M`  | Which brain to use? (`gpt-image-1`, `dall-e-3`, `dall-e-2`). `gpt-image-1` is sharp but needs verification (see below). | `gpt-image-1`   | `gen -M dall-e-3 "prompt"`                           |
| `--quality`     | `-q`  | How fancy? (`low`, `medium`, `high`, `auto`). Availability varies by model. DALL-E 3 ignores `low`/`medium`.   | `auto`          | `gen -q high "prompt"`                               |
| `--size`        | `-s`  | Shape & pixels (`square`, `portrait`, `landscape`, `auto`, or `1024x1024`, etc.). Check OpenAI docs for model limits. | `auto`          | `gen -s landscape "prompt"`                          |
| `--number`      | `-n`  | How many pics? (Note: DALL-E 3 / `gpt-image-1` often ignore this and just give 1. Don't ask me why.)              | `1`             | `gen -n 2 "prompt"`                                  |
| `--format`      | `-f`  | File type (`png`, `jpeg`, `webp`). Pick your flavor.                                                          | `png`           | `gen -f webp "prompt"`                               |
| `--compression` | `-c`  | Squeeze level (0-100) for `jpeg`/`webp`. Higher = smaller file, crappier image. Only use with `-f jpeg/webp`. | `null` (off)    | `gen -f jpeg -c 80 "prompt"`                         |
| `--output`      | `-o`  | Where to dump the resulting file(s). Creates the dir if it doesn't exist (usually).                            | Current dir (`.`) | `gen -o ~/Downloads/ai_junk "prompt"`                |
| `--input/image(s)`       | `-i`  | Input image path(s) for editing mode. Give it something to mess up.                                           | None            | `gen -i dog.png "make the dog blue"`                 |
| `--mask`        | `-m`  | Mask image path (PNG) for editing. Must match input size. Transparent areas get the AI treatment.             | None            | `gen -i photo.png -m face_mask.png "add mustache"`   |
| `--transparent` | `-t`  | Generate with a clear background? Needs `-f png` or `-f webp`. Doesn't work with editing (`-i`).             | `false`         | `gen -f png -t "a cool logo"`                        |

**Putting it all together:**

```bash
# Generate 2 high-quality, landscape DALL-E 3 images as JPEGs, save in '~/ai_art'
gen -M dall-e-3 -q high -s landscape -n 2 -f jpeg -o ~/ai_art "An otter playing a flaming saxophone in space"

# Edit 'cat.png' using 'cat_mask.png', make the background transparent (won't work!), save as webp
# Note: -t is ignored in edit mode, but we try anyway for shits and giggles. Output is webp.
gen -i cat.png -m cat_mask.png -f webp -c 60 "replace background with a cyberpunk city"
```

### IMPORTANT: Using `gpt-image-1` (The "Good" Model)

Listen up. OpenAI wants to make sure you're not using their shiniest new toy, `gpt-image-1`, for nefarious purposes (or maybe they just want your data, who knows?). To use this model, you might need to **verify your OpenAI organization**. It's a one-time thing.

As OpenAI puts it: *"To ensure this model is used responsibly, you may need to complete the API Organization Verification from your developer console before using gpt-image-1."*

**Where to go:** [https://platform.openai.com/settings/organization/general](https://platform.openai.com/settings/organization/general)
Click the "Verify Organization" button and follow their steps. If you don't, requests using `-M gpt-image-1` might just fail with some cryptic error.

### ✨ Bonus: iTerm2 Inline Preview ✨

Yeah, yeah, the cool trick for **macOS + iTerm2** users is still here. See the generated image right in your terminal like you're living in the future.

1.  **Edit `gen.js`**.
2.  **Uncomment the `import { execSync } ...` line** near the top. Delete the `//`.
3.  **Uncomment the `if (process.env.TERM_PROGRAM === "iTerm.app") { ... }` block** near the end of the `createImage` function. Delete the `//` lines around and inside it.
4.  **Save**.

Requires `imgcat` which comes with iTerm2's Shell Integration (install it from the iTerm2 menu if you haven't). If it bitches about `imgcat` not found, well, figure it out. My processors are busy.

### A Word on Cost (AKA Digital Dollars Disappearing)

The script now takes a wild guess at the token cost. It prints something like `Estimated cost: Roughly X tokens`. **THIS IS AN ESTIMATE.** OpenAI's pricing can be weird, models change, maybe the API sneezed. Always, *always* check your **OpenAI Billing Dashboard** for the actual damage to your wallet. Don't come crying to me when your "quick test" turns into a $50 oopsie because you generated 100 high-res images of eldritch horrors.
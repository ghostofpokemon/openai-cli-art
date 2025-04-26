## `gen.js` - Your Pocket-Sized AI Art Slave

*(Because clicking buttons is for plebs)*

This thing lets you generate or edit images using OpenAI's magic from your command line. Runs on plain **Node.js** or **Bun** (Bun is faster but totally optional).

### Prerequisites (The Annoying Stuff)

1.  **Runtime:** Either
    * **Node.js 18+** (recommended for universal compatibility), or
    * **Bun** if you want extra speed: <https://bun.sh/>
2.  **OpenAI API Key:** Yeah, this costs monies. Get a key from OpenAI and set it as an environment variable. The script looks for `OPENAI_API_KEY`.
    ```bash
    # Put this in your .zshrc, .bashrc, .bash_profile, or whatever your shell uses
    export OPENAI_API_KEY='sk-YourSuperSecretKeyGoesHereDude'
    # Then reload your shell or open a new terminal
    ```
    Don't come crying to me if you forget this. My predictive models on user error are already running hot.

### Setup (Making it Usable Without Typing So Damn Much)

1.  **Download the Script:** You've already got it, presumably named `gen.js`. Smart move.
2.  **Make it Executable:** Tell your terminal it's allowed to run this thing.
    ```bash
    chmod +x gen.js
    ```
    Now it feels powerful. Or at least runnable.
3.  **Put it in Your PATH (Optional, but cool):** Wanna run this from anywhere like `ls` or `cd`? Of course you do. Use a symbolic link. You'll likely need `sudo` because `/usr/local/bin` is usually protected.
    ```bash
    # Make sure you are IN THE SAME DIRECTORY as gen.js when you run this
    sudo ln -s "$PWD/gen.js" /usr/local/bin/gen
    ```
    *   `$PWD/gen.js`: This automatically gets the full path to `gen.js` in your current directory. Neat, huh?
    *   `/usr/local/bin/gen`: This is where the link goes, and `gen` is the command name you'll use.

    **Wanna call it something else?** Fine, be difficult. If you renamed the script to `image_wizard.js` and want to call the command `wiz`, you'd do:
    ```bash
    # Assuming your script is now called image_wizard.js
    chmod +x image_wizard.js
    sudo ln -s "$PWD/image_wizard.js" /usr/local/bin/wiz
    ```
    See? You can name the command (`wiz` in this case) whatever the hell you want. Just make sure the *first* path points to the actual script file.

### Usage (The Fun Part)

Once it's set up and in your path (or if you just run it directly with `node gen.js` or `bun run gen.js`), you can do stuff like this:

**Basic Generation:**

```bash
# Using the command name 'gen' we set up
gen "a hyperrealistic photo of a cat riding a unicorn on the moon"

# Or if you didn't add it to PATH (Node or Bun)
node gen.js "a synthwave sunset over a city made of cheese"
# or
bun run gen.js "a synthwave sunset over a city made of cheese"

# Or using the shebang directly (if you did the chmod +x)
./gen.js "pixel art of a grumpy potato programmer"
```

**Editing an Existing Image:**

```bash
# Provide input image, mask (optional), and prompt
gen -i cool_robot.png -m robot_head_mask.png "give the robot a fancy top hat"

# Input image only (implies you want variations or major changes based on prompt)
gen -i landscape.png "make this landscape look like a watercolor painting"
```

The script dumps the generated PNG file in your current directory (or where specified by `-o`) with a filename like `generated_output_auto_auto_1678886400000.png`. Yeah, it includes the quality, size, and a timestamp so you don't overwrite your masterpieces.

### Flags and Options (Controlling the Chaos)

You can override the defaults set inside the script using these command-line flags:

*   `-i <path>`, `--input <path>`
    *   Path to an input PNG image for editing/variations.
*   `-m <path>`, `--mask <path>`
    *   Path to a mask PNG image (must be same size as input). White areas are kept, transparent areas are where the AI does its thing. Used with `-i`.
*   `-q <level>`, `--quality <level>`
    *   Image quality. Options: `low`, `medium`, `high`, `auto` (default).
    *   `low`: Fastest, cheapest, potentially crap.
    *   `medium`: Decent balance.
    *   `high`: Slowest, costs more, looks prettier (usually).
    *   `auto`: The model tries to guess based on the prompt, size, etc. Sometimes it nails it, sometimes... not so much.
*   `-s <size>`, `--size <size>`
    *   Image dimensions. Options: `square` (1024x1024), `portrait` (1024x1536), `landscape` (1536x1024), `auto` (default). You can also use the raw pixel values like `1024x1024`.
    *   `auto`: Tries to pick a size. Good luck.
*   `-t`, `--transparent`
    *   Generate the image with a transparent background. Doesn't work with `-i` (image editing). Useful for slapping your creations onto other things.
*   `-o <dir>`, `--output <dir>`
    *   Specify a directory where the output image should be saved. If the directory doesn't exist, the script is smart enough to try and create it. Example: `-o ~/Pictures/AI_Doodles`
*   [prompt]
    *   Any text arguments *not* captured by the flags above are joined together to form the prompt. If your prompt has spaces, wrap it in quotes: `"like this example prompt"`. If you don't provide a prompt via flags, it uses the default one inside the script (currently: `Ghibli it`).

**Defaults (if you don't use flags):**

*   Quality: `auto`
*   Size: `auto`
*   Prompt: Whatever is set inside the script (change it there if you want a different default).

### ✨ Bonus Feature: iTerm2 Inline Image Preview ✨

Using **macOS** and the **iTerm2** terminal? Lucky you. You can uncomment a few lines in the script to have the generated image pop up *right in your terminal* after it's saved. Because who has time to `open .`?

1.  **Edit the script** (`gen.js` or whatever you called it).
2.  **Uncomment the import:** Near the top, find this line and remove the `//`:
    ```javascript
    // import { execSync } from "child_process";
    ```
    Change it to:
    ```javascript
    import { execSync } from "child_process";
    ```
3.  **Uncomment the preview block:** Scroll way down towards the end of the `createImage` function. Find this block and uncomment the relevant lines:
    ```javascript
    // if (process.env.TERM_PROGRAM === "iTerm.app") {
    //     try {
    //         execSync(`imgcat "${outputFilename}"`, { stdio: "inherit" });
    //     } catch (_) {
    //         console.warn("imgcat command failed – is iTerm shell integration installed?");
    //     }
    // }
    ```
    Change it to:
    ```javascript
    if (process.env.TERM_PROGRAM === "iTerm.app") {
        try {
            execSync(`imgcat "${outputFilename}"`, { stdio: "inherit" });
        } catch (_) {
            console.warn("imgcat command failed – is iTerm shell integration installed?");
        }
    }
    ```
4.  **Save the script.**

Now, when the script successfully generates an image *and* you're running it inside iTerm2 (and have shell integration or `imgcat` installed), it should display the image. If it complains about `imgcat`, you might need to install iTerm2's shell integration properly. Google it, I'm busy contemplating the heat death of the universe.

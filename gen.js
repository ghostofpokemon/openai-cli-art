#!/usr/bin/env node
// Filename: gen.js
// Run with: node/bun gen.js
// or `chmod +x gen.js` then `./gen.js`
// OR export PATH="$PATH:$(pwd)" and then just `gen`

import OpenAI, { toFile } from "openai";
import fs from "fs";
import path from "path"; // Let's use path for cleaner file naming
// Optional terminal preview (iTerm2). Uncomment the next line if you enable the imgcat preview at the bottom of the file.
// import { execSync } from "child_process";

// --- CONFIGURATION STATION ---
// Change this shit easily right here

// 1. The Almighty Prompt (Get creative, you beautiful weirdo)
let prompt = `Ghibli it`;

// --- Additional dynamic settings ---
let numImages = 1; // -n/--number
let outputFormat = "png"; // -f/--format
let outputCompression = null; // -c/--compression (0-100) only for jpeg/webp

// 2. Quality Control (Pick one: 'low', 'medium', 'high')
// 'low' is fastest/cheapest, 'high' is slow af but pretty. 'medium' is... medium.
let imageQuality = "auto"; // placeholder; will set default per model later

// Model selection
const allowedModels = ["gpt-image-1", "dall-e-2", "dall-e-3"];
let modelName = allowedModels[0];

// Determine default quality if still 'auto'
if (imageQuality === "auto") {
    if (modelName === "gpt-image-1") imageQuality = "low"; // retain previous behaviour maybe low? but earlier auto; choose low default
    else imageQuality = "standard";
}

// Validate quality vs model
const allowedQualityPerModel = {
    "gpt-image-1": ["low", "medium", "high"],
    "dall-e-3": ["standard", "hd"],
    "dall-e-2": ["standard"],
};

if (!allowedQualityPerModel[modelName].includes(imageQuality)) {
    console.warn(`Quality '${imageQuality}' not supported for model ${modelName}. Falling back to default.`);
    imageQuality = allowedQualityPerModel[modelName][0];
}

// Pricing tables (USD per image)
const pricing = {
    "gpt-image-1": {
        low: { "1024x1024": 0.011, "1024x1536": 0.016, "1536x1024": 0.016 },
        medium: { "1024x1024": 0.042, "1024x1536": 0.063, "1536x1024": 0.063 },
        high: { "1024x1024": 0.167, "1024x1536": 0.25, "1536x1024": 0.25 },
    },
    "dall-e-3": {
        standard: { "1024x1024": 0.04, "1024x1792": 0.08, "1792x1024": 0.08 },
        hd: { "1024x1024": 0.08, "1024x1792": 0.12, "1792x1024": 0.12 },
    },
    "dall-e-2": {
        standard: { "256x256": 0.016, "512x512": 0.018, "1024x1024": 0.02 },
    },
};

// 3. Size Matters (Pick one: '1024x1024', '1024x1536', '1536x1024')
// The API is picky, gotta use these exact strings. No random pixel counts, sorry chief.
// '1024x1024' = Square
// '1024x1536' = Portrait-ish (2:3)
// '1536x1024' = Landscape-ish (3:2)
const square = "1024x1024";
const portrait = "1024x1536";
const landscape = "1536x1024";

const sizeMap = {
    square,
    portrait,
    landscape,
};

let imageSize = "auto"; // <--- CHANGE ME

// 4. Output Filename (We'll make it dynamic based on settings)
const baseFilename = "generated_output";
// Default output directory is the folder you run the command from.
// If you prefer a fixed directory, uncomment the next line and set it.
// let outputDir = "/absolute/path/to/your/preferred/folder";
let outputDir = process.cwd();

// ------------------ CLI ARG PARSING ------------------
// Allow users to pass flags for input image (-i/--input), mask (-m/--mask),
// and transparency (-t/--transparent). Example usage:
//   bun run gen.js --input original.png --mask mask.png --transparent
const args = process.argv.slice(2);
const inputImagePaths = [];
let maskImagePath = null;
let enableTransparency = false;

const leftoverTokens = [];

for (let i = 0; i < args.length; i++) {
    const token = args[i];
    switch (token) {
        case "-i":
        case "--input":
        case "-input": // forgiving alias
        case "--image":
        case "-image":
        case "--images":
        case "-images": {
            // Collect one or more image paths until the next token starts with '-'
            let j = i + 1;
            while (j < args.length && !args[j].startsWith("-")) {
                inputImagePaths.push(args[j]);
                j++;
            }
            if (j === i + 1) {
                console.warn(`${token} flag expects at least one file path afterwards.`);
            }
            i = j - 1; // Jump past consumed tokens
            break;
        }
        case "-m":
        case "--mask":
            maskImagePath = args[++i];
            break;
        case "-q":
        case "--quality":
            const providedQuality = (args[++i] || "").toLowerCase();
            if (["low", "medium", "high", "auto"].includes(providedQuality)) {
                imageQuality = providedQuality;
            } else {
                console.warn(`Invalid quality '${providedQuality}'. Must be low, medium, or high.`);
            }
            break;
        case "-s":
        case "--size":
            const providedSize = args[++i];
            if (providedSize === "auto") {
                imageSize = "auto";
            } else if (sizeMap[providedSize]) {
                imageSize = sizeMap[providedSize];
            } else if ([square, portrait, landscape].includes(providedSize)) {
                imageSize = providedSize; // raw pixel size allowed
            } else {
                console.warn(
                    `Invalid size '${providedSize}'. Use square, portrait, landscape, auto, or raw pixel sizes ${square}, ${portrait}, ${landscape}.`
                );
            }
            break;
        case "-t":
        case "--transparent":
            enableTransparency = true;
            break;
        case "-o":
        case "--output":
            const providedDir = args[++i];
            if (providedDir) {
                outputDir = providedDir;
            } else {
                console.warn("--output flag expects a directory path afterwards.");
            }
            break;
        case "-M":
        case "--model":
            const providedModel = args[++i];
            if (allowedModels.includes(providedModel)) {
                modelName = providedModel;
            } else {
                console.warn(`Invalid model '${providedModel}'. Choose from ${allowedModels.join(", ")}.`);
            }
            break;
        case "-n":
        case "--number":
            const nVal = parseInt(args[++i], 10);
            if (!isNaN(nVal) && nVal > 0) {
                numImages = nVal;
            } else {
                console.warn("Invalid number for -n/--number, must be positive integer.");
            }
            break;
        case "-f":
        case "--format":
            const fmt = (args[++i] || "").toLowerCase();
            if (["png", "jpeg", "webp"].includes(fmt)) {
                outputFormat = fmt;
            } else {
                console.warn("Invalid format. Choose png, jpeg, or webp.");
            }
            break;
        case "-c":
        case "--compression":
            const compVal = parseInt(args[++i], 10);
            if (!isNaN(compVal) && compVal >= 0 && compVal <= 100) {
                outputCompression = compVal;
            } else {
                console.warn("Compression must be 0-100.");
            }
            break;
        default:
            if (token.startsWith("-")) {
                console.warn(`Unknown argument: ${token}`);
            } else {
                leftoverTokens.push(token);
            }
    }
}

if (leftoverTokens.length) {
    prompt = leftoverTokens.join(" ");
}

if (inputImagePaths.length) console.log(`Input images: ${inputImagePaths.join(", ")}`);
if (maskImagePath) console.log(`Mask image provided:  ${maskImagePath}`);
if (enableTransparency) console.log("Transparency enabled (background=transparent)");
console.log(`Image quality set to '${imageQuality}'`);
console.log(`Image size set to '${imageSize}'`);
console.log(`Model: ${modelName}`);
console.log(`Images to generate: ${numImages}`);
console.log(`Output format: ${outputFormat}${outputCompression !== null ? ` (compression ${outputCompression}%)` : ""}`);
console.log(`Output directory: ${outputDir}`);
if (leftoverTokens.length) console.log(`Overriding prompt from CLI: "${prompt}"`);
// -----------------------------------------------------

// --- END CONFIGURATION ---
// Don't fuck with stuff below unless you know what you're doing

// Make sure the output directory exists (unless it's current directory which already does)
if (!fs.existsSync(outputDir)) {
    console.log(`Creating output directory: ${outputDir}`);
    fs.mkdirSync(outputDir, { recursive: true });
}

// Construct a glorious filename
const outputFilename = path.join(
    outputDir,
    `${baseFilename}_${imageQuality}_${imageSize}_${Date.now()}.${outputFormat === "jpeg" ? "jpg" : outputFormat}`
);

// Let's do the damn thing
async function createImage() {
    // Assumes OPENAI_API_KEY is set in your environment variables.
    // If not, Bun will whine, or OpenAI() will throw a fit.
    const openai = new OpenAI();

    console.log(`Alright, let's cook up this image...`);
    console.log(`Prompt: "${prompt.trim().substring(0, 100)}..."`);
    console.log(`Quality: ${imageQuality}, Size: ${imageSize}`);

    try {
        // Build the common parameters
        const params = {
            model: modelName,
            prompt: prompt,
            n: numImages,
            size: imageSize,
            quality: imageQuality,
            output_format: outputFormat,
            moderation: "low", // Default to the least-restrictive moderation
        };

        if (outputCompression !== null) {
            params.output_compression = outputCompression;
        }

        // Validate transparency vs format
        if (enableTransparency && !["png", "webp"].includes(outputFormat)) {
            console.warn("Transparency only supported with png or webp. Disabling transparency flag.");
            enableTransparency = false;
        }

        if (enableTransparency) {
            params.background = "transparent";
        }

        // --- Cost Estimation ---
        const sizeKeyForPricing = imageSize === "auto" ? "1024x1024" : imageSize; // rough default
        let unitPrice = null;
        const priceTable = pricing[modelName]?.[imageQuality];
        if (priceTable && priceTable[sizeKeyForPricing]) {
            unitPrice = priceTable[sizeKeyForPricing];
        }

        if (unitPrice !== null) {
            const estCost = unitPrice * numImages;
            console.log(`Estimated cost: $${estCost.toFixed(3)} (${numImages} x $${unitPrice})`);
        } else {
            console.log("Estimated cost: (unknown for this model/size/quality combination)");
        }

        let result;

        if (inputImagePaths.length) {
            // --- EDIT MODE ---
            const imageFiles = await Promise.all(
                inputImagePaths.map(async (p) =>
                    await toFile(fs.createReadStream(p), null, { type: "image/png" })
                )
            );
            // If only one image we can send single object else array
            params.image = imageFiles.length === 1 ? imageFiles[0] : imageFiles;

            if (maskImagePath) {
                params.mask = await toFile(fs.createReadStream(maskImagePath), null, {
                    type: "image/png",
                });
            }

            console.log("Calling images.edit() with params:", {
                ...params,
                image: inputImagePaths,
                mask: maskImagePath ?? undefined,
            });

            result = await openai.images.edit(params);
        } else {
            // --- GENERATE MODE ---
            console.log("Calling images.generate() with params:", params);
            result = await openai.images.generate(params);
        }

        console.log("OpenAI did its thing. Got the data back.");

        // Check if we actually got data back, ya know, just in case
        if (!result.data || !result.data[0] || !result.data[0].b64_json) {
            console.error("WTF? No image data received from OpenAI. Response:", result);
            throw new Error("Missing b64_json in OpenAI response.");
        }

        const image_base64 = result.data[0].b64_json;
        const image_bytes = Buffer.from(image_base64, "base64");

        console.log(`Saving this bad boy to: ${outputFilename}`);
        fs.writeFileSync(outputFilename, image_bytes);

        console.log(`\nSuccess! Image saved. Go check out ${outputFilename}`);
        console.log(`It cost approximately some tokens. Check your dashboard if you care.`);

        // -------------------------------------------------------------
        // OPTIONAL: Preview the image in iTerm2 using "imgcat".
        // This requires the iTerm2 shell integration (or "imgcat" utility)
        // and only works in terminals that support the iTerm inline image
        // protocol.
        //
        // To enable, uncomment the two lines below **and** the import of
        // execSync from "child_process" near the top of the file.
        //
        // if (process.env.TERM_PROGRAM === "iTerm.app") {
        //     try {
        //         execSync(`imgcat "${outputFilename}"`, { stdio: "inherit" });
        //     } catch (_) {
        //         console.warn("imgcat command failed – is iTerm shell integration installed?");
        //     }
        // }
        // -------------------------------------------------------------

    } catch (error) {
        console.error("\n--- OH SHIT, SOMETHING WENT WRONG ---");
        if (error.response) {
            // More detailed API error
            console.error("API Error Status:", error.response.status);
            console.error("API Error Data:", error.response.data);
        } else {
            // Generic error
            console.error("Error:", error.message);
        }
        console.error("--------------------------------------");
        console.log("Maybe check your API key, prompt, or if OpenAI is having a bad day?");
    }
}

// Fire it up!
createImage();
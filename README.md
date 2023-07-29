# stable-diffusion-ps-pea
Stable Diffusion plugin for Photoshop/Photopea based on A1111 API.

## Installation
**Step1: Setup backend service**
Set following command line arguments in `webui-user.bat`:
```bat
set COMMANDLINE_ARGS=--api --cors-allow-origins https://huchenlei.github.io [Rest of ARGS...]
```

For SDNext(V1111) users, set following arguments:
```bat
set COMMANDLINE_ARGS=--cors-origins https://huchenlei.github.io [Rest of ARGS...]
```

**Step2: Click Window>Plugin**
![Step2](https://github.com/huchenlei/stable-diffusion-ps-pea/assets/20929282/a91df408-76c6-4300-8987-41f7971379a5)
**Step3: Search for stable-diffusion-ps-pea**
![Install](https://github.com/huchenlei/stable-diffusion-ps-pea/assets/20929282/35c2b802-4f31-45c2-8a24-e55f621adfae)
## Features
**Reference range selection**
In A1111 img2img inpaint, one painpoint is that the inpaint area selection is either `WholeImage` or `OnlyMasked`. This
might not be an issue when the image is within reasonable size (512x512). Once the image becomes big (1024x1024+), the
time and resouce required for inpaint area to be `WhileImage` grows exponentially, which makes this option not viable, but
sometimes we do want to reference a limited range of surroundings. In this situation, one need to crop the image in an
image editor, ask A1111 to only process the cropped image, then put the cropeed image back to the original big image.

This is a tedious process, but now we have this behaviour as default in `stable-diffusion-ps-pea`. Everytime you do an
img2img, optionally you can apply a reference range (%/px), or you can just manually specify the range by creating another
selection on canvas.

![ref_area](https://github.com/huchenlei/stable-diffusion-ps-pea/assets/20929282/951c2420-d5cd-4e65-bde2-45a0880ea73c)

**Scale ratio**
In whole body generation, some body parts (hand/face) often becomes bad in quality, because there are just not enough
pixels for the diffusion model to add details to. The diffusion model also performs less well on aspect ratios other
than the ratios it was trained on (512x512 for SD1.5, 1024x1024 for SDXL), so doing inpaint in a small area only help
a little. The solution is simple here, when inpainting a small area, we let A1111 target a bigger area closer to diffusion
model's trained aspect ratio and resize the output to put the result image back to the original inpaint spot. The very
popular extension ADetailer is doing this exact process but using image detection models to automatically detect 
face/hand/body to fix.

![scale_ratio](https://github.com/huchenlei/stable-diffusion-ps-pea/assets/20929282/41df7f23-f752-4477-8304-9e06f9725eb3)

**ControlNet**
Majority of ControlNet models can be applied to a specific part of the image (canny, depth, openpose, etc). However,
in normal A1111 ControlNet UI, you cannot easily visualize the spatial relationship between each ControlNet unit.

One example is shown in following video. The author uses openpose to control body pose, and softedge to control hand
detail. Noting that he is using a image editor to edit the softedge map to keep only the hand part.
[![Basic Workflow](http://img.youtube.com/vi/UgVOQTjahxc/0.jpg)](https://www.youtube.com/watch?v=UgVOQTjahxc)

This type of operation now becomes very easy in `stable-diffusion-ps-pea`. The ControlNet maps can easily overlay
on top of each other. Here I am using a openpose unit and a lineart unit.

![elon](https://github.com/huchenlei/stable-diffusion-ps-pea/assets/20929282/1834d24f-e994-41e6-ba19-01a1d0cd1655)
![cnet](https://github.com/huchenlei/stable-diffusion-ps-pea/assets/20929282/5dcb6d6f-5c3e-4cf8-abf6-c5223059a8af)
![5b57323c40b09034008b45e7](https://github.com/huchenlei/stable-diffusion-ps-pea/assets/20929282/1938eac3-4a11-4d6a-95c1-eda23be453ea)

Initial proposal to implement layer control in ControlNet's repo: [Issue #1736](https://github.com/Mikubill/sd-webui-controlnet/issues/1736).

**Config System**
One pain point about A1111 is that it is hard to define workflow. There are many configuration I wish can be restored
later when I was using A1111. So here I designed a configuration system that let users easily define workflow.

There are 3 types of config in `stable-diffusion-ps-pea`:
- Base: The config representing the hardcoded default values for each generation parameters.
- Default: The default config when each time you enter the UI or click the `refresh` button at the bottom right corner.
Clicking the checkmark will activate the current selected config as default.
![default_config](https://github.com/huchenlei/stable-diffusion-ps-pea/assets/20929282/207672ad-4dcb-4309-8459-be16e029905a)
- Toolbox: The addon configs that only applied temporarily on the generation triggered by clicking the corresponding
toolbox button. This is where you can define you customized workflow.
![toolbox](https://github.com/huchenlei/stable-diffusion-ps-pea/assets/20929282/ae67f328-42e9-4425-8b8e-8d75b1574853)

Configs are defined as the delta to apply on top of the current UI states. Here are some examples I wrote and you can download `config_sharing/huchenlei_configs.json5` and upload it in config panel to get access to them.

**LamaGenFill:** Use ControlNet's `inpaint_only+lama` to achieve similar effect of adobe's generative fill, and magic eraser. We accept JSON5 as config format, so you can actually add comment in config file.
```json5
"LamaGenFill": [
        {
            "kind": "E",
            "path": [
                "img2imgPayload",
                "denoising_strength"
            ],
            "lhs": 0.75,
            "rhs": 1
        },
        {
            "kind": "E",
            "path": [
                "img2imgPayload",
                "inpainting_fill"
            ],
            "lhs": 1,
            "rhs": 3, // Inpaint fill is latent nothing.
        },
        {
            "kind": "E",
            "path": [
                "img2imgPayload",
                "inpaint_full_res"
            ],
            "lhs": 0,
            "rhs": 0, // Make sure inpaint reference range is whole image.
        },
        {
            "kind": "A",
            "path": [
                "controlnetUnits"
            ],
            "index": 0,
            "item": {
                "kind": "N",
                "rhs": {
                    "batch_images": "",
                    "control_mode": 2,
                    "enabled": true,
                    "guidance_end": 1,
                    "guidance_start": 0,
                    "input_mode": 0,
                    "low_vram": false,
                    "model": "control_v11p_sd15_inpaint [ebff9138]",
                    "module": "inpaint_only+lama",
                    "output_dir": "",
                    "pixel_perfect": false,
                    "processor_res": 512,
                    "resize_mode": 1,
                    "threshold_a": 64,
                    "threshold_b": 64,
                    "weight": 1,
                    "linkedLayerName": ""
                }
            }
        }
    ],
```
Generative Fill using `LamaGenFill` workflow:
![GenFill1](https://github.com/huchenlei/stable-diffusion-ps-pea/assets/20929282/4ae79838-ddeb-452a-a052-2b414381e709)
![GenFill2](https://github.com/huchenlei/stable-diffusion-ps-pea/assets/20929282/f8406fcd-c7a6-4e81-9aeb-290e21755123)
Magic Eraser using `LamaGenFill` workflow:
![Eraser1](https://github.com/huchenlei/stable-diffusion-ps-pea/assets/20929282/da087193-a343-43fb-acc8-366e8d1d4b78)
![Eraser2](https://github.com/huchenlei/stable-diffusion-ps-pea/assets/20929282/cd1e335e-1513-45bf-8cda-7df789e995dc)

**TileUpscale2x**
As previously demoed about scale ratio, this workflow is used to fix hand/face, and add details to the selected region.
```json
"TileUpscale2x": [
        {
            "kind": "E",
            "path": ["imageScale"],
            "lhs": 1,
            "rhs": 2,
        },
        {
            "kind": "A",
            "path": [
                "controlnetUnits"
            ],
            "index": 0,
            "item": {
                "kind": "N",
                "rhs": {
                    "batch_images": "",
                    "control_mode": 0,
                    "enabled": true,
                    "guidance_end": 1,
                    "guidance_start": 0,
                    "input_mode": 0,
                    "low_vram": false,
                    "model": "control_v11f1e_sd15_tile [a371b31b]",
                    "module": "tile_resample",
                    "output_dir": "",
                    "pixel_perfect": false,
                    "processor_res": 512,
                    "resize_mode": 1,
                    "threshold_a": 1,
                    "threshold_b": 64,
                    "weight": 1,
                    "linkedLayerName": ""
                }
            }
        }
    ],
```
Here is a video demo using it: https://www.loom.com/share/fb11c0206d7045469b82fe9d6342bd15

## Development plan

1. Basic UI setting for image generation
   - [*DONE*] We should not distinguish txt2img and img2img. (Maybe txt2img in some advanced settings?). Fill on an empty selection should trigger txt2img, otherwise img2img.
   - [*DONE*] Prompt input, various configuration input UI.
   - [*DONE*] Get input from current photopea selection (Capture the selected content)
   - [*DONE*] Sending inputs to A1111 API
   - [*DONE*] Render the returned image on photopea canvas
   - [*DONE*] Ckpt selection
   - VAE selection.
   - [*DONE*] Generation progress bar.
1. [*DONE*] Universal extension support
   - [*DONE*] Raw text input for extension's script args.
1. [*DONE*] Savable run configuration
   - [*DONE*] Reset button on generation page to reset everything to default
2. Prompt textbox
   - Auto complete (Self prompt use history and prompt use DB)
   - Templates (Default quality prompt, negative embeddings, etc)
   - Prompt token estimation (75/150/225)
   - [*DONE*] LoRA selection (LoRA should be selected instead of being put into prompt ideally)
     - Automatically detect LoRA trigger words
     - [*DONE*] Search bar on LoRA selection
3. [*DONE*] ControlNet support 
   - [*DONE*] Select a layer, choose a preprocessor can convert it to ControlNet layer.
   - [*DONE*] ControlNet layer will be used as ControlNet input
   - [*DONE*] Control type selection
   - [*DONE*] Inpaint support
   - [*DONE*] Reference support
   - Support openpose editor
   - [*DONE*] Preset
4. [*DONE*] Inpaint
   - [*DONE*] Create a selection and hit generative fill will by default will trigger inpaint with reference to a reasonable context (512x512?).
   - [*DONE*] Provide another button (choose custom inpaint reference area besides inpaint button to let user specify another selection)
   - [*DONE*] Provide a progress on UI to show user the current state.
5. [*DONE*] Connection management.
6. [*DONE*] History view
   - [*DONE*] Each run's config should be saved. Can either fully restore state, or partial restore (only prompt / only ControlNet state) 
7. Support upscale script
   - Automatically trigger upscale script if the target width/height is too big (after scale ratio)
   - Support whole picture upscale. (Paste the result to a new file?)
8. Support segment anything.
   
### Minior TODOs
- [*DONE*] Fix display of ControlNet unit header (close button should be at end of row)
- [*DONE*] Make step of SliderGroup log-based, i.e. 1, 2, 4, 8
- [*DONE*] Update favicon
- [*DONE*] Update thumbnail (sd.png)
- [*DONE*] Lock result selection panel after clicking on an item. If clicking very fast task send tophotopea still will timeout.
- [*OBSOLETE*] File based config. Add comments in default config file.
- [*DONE*] Correctly handle list diff when diff appState.
- [*DONE*] Add a way to trigger overlay of config directly from generation view.
- [*DONE*] Hide page name text on nav bar by default to save space (only show when hover on icon).
- [*DONE*] Provide an exit button to reset generation state to kInitial.
- Improve mask capturing for very large images. Currently the crop is done by exporting the whole image out, and then do the crop in fabric.js. This can be very inefficient if the canvas is large.

# Development
## Setup HTTPS
The dev server needs to run under HTTPS because the plugin runs in an iframe that is embedded in an HTTPS environment. 
Using HTTP will make the browser complain about mixing HTTP/HTTPS content on a page.

Linux/Mac bash
`openssl req -x509 -nodes -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -subj "/CN=localhost"`

Windows bash
`openssl req -x509 -nodes -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -subj "//CN=localhost"`

## Setup A1111
Add `--cors-allow-origins https://localhost:5173` to WebUI command line args for local development.

## Add dev plugin to photopea plugin store
I do not make my dev plugin setup public as it might confuse user which plugin to install. So if you are planning to do development of
this plugin, I kindly ask every developer to add their own dev plugin to photopea plugin store following these steps:

**Step1: Click Window>Plugin**
![Step1](https://github.com/huchenlei/stable-diffusion-ps-pea/assets/20929282/a91df408-76c6-4300-8987-41f7971379a5)
**Step2: Click Add Plugin**
![Step2](https://github.com/huchenlei/stable-diffusion-ps-pea/assets/20929282/c559bb60-113d-4a9b-a737-a6a14087c3a8)
**Step3: Click New**
![Step3](https://github.com/huchenlei/stable-diffusion-ps-pea/assets/20929282/0f47a0dc-5916-44bd-823a-2a7d89c5e331)
**Step4: Fill the Form**  
![Step4](https://github.com/huchenlei/stable-diffusion-ps-pea/assets/20929282/6aa8dd13-eba7-46df-bef1-4fe822726b23)
- File: upload `photopea_dev.json` in project root directory
- Thumbnail: Use any image link with proper size. I use `https://huchenlei.github.io/stable-diffusion-ps-pea/sd.png`
- Make sure to check `Make Public`.

**Step5: Install the plugin**  
You should be able to find the newly added plugin in the plugin store.

**Step6: Make the plugin private**  
Go back to Step3 panel, and click `Edit` on the plugin you just added. Uncheck `Make Public`.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin) to make the TypeScript language service aware of `.vue` types.

If the standalone TypeScript plugin doesn't feel fast enough to you, Volar has also implemented a [Take Over Mode](https://github.com/johnsoncodehk/volar/discussions/471#discussioncomment-1361669) that is more performant. You can enable it by the following steps:

1. Disable the built-in TypeScript Extension
    1) Run `Extensions: Show Built-in Extensions` from VSCode's command palette
    2) Find `TypeScript and JavaScript Language Features`, right click and select `Disable (Workspace)`
2. Reload the VSCode window by running `Developer: Reload Window` from the command palette.

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Run End-to-End Tests with [Nightwatch](https://nightwatchjs.org/)

```sh
# When using CI, the project must be built first.
npm run build

# Runs the end-to-end tests
npm run test:e2e
# Runs the tests only on Chrome
npm run test:e2e -- --env chrome
# Runs the tests of a specific file
npm run test:e2e -- tests/e2e/example.ts
# Runs the tests in debug mode
npm run test:e2e -- --debug
```
    
### Run Headed Component Tests with [Nightwatch Component Testing](https://nightwatchjs.org/guide/component-testing/introduction.html)
  
```sh
npm run test:unit
npm run test:unit -- --headless # for headless testing
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

# stable-diffusion-ps-pea
Stable Diffusion plugin for Photoshop/Photopea based on A1111 API.

## Setup
Set following command line arguments in `webui-user.bat`:
```bat
set COMMANDLINE_ARGS=--api --cors-allow-origins https://huchenlei.github.io [Rest of ARGS...]
```

For V1111 users, set following arguments:
```bat
set COMMANDLINE_ARGS=--cors-origins https://huchenlei.github.io [Rest of ARGS...]
```

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
     - Search bar on LoRA selection
3. [*DONE*] ControlNet support 
   - [*DONE*] Select a layer, choose a preprocessor can convert it to ControlNet layer.
   - [*DONE*] ControlNet layer will be used as ControlNet input
   - [*DONE*] Control type selection
   - [*DONE*] Inpaint support
   - [*DONE*] Reference support
   - Support openpose editor
   - Preset
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
- Update thumbnail (sd.png)
- [*DONE*] Lock result selection panel after clicking on an item. If clicking very fast task send tophotopea still will timeout.
- [*OBSOLETE*] File based config. Add comments in default config file.
- Correctly handle list diff when diff appState.
- Add a way to trigger overlay of config directly from generation view.
- [*DONE*] Hide page name text on nav bar by default to save space (only show when hover on icon).
- Provide an exit button to reset generation state to kInitial.
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

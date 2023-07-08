# stable-diffusion-ps-pea
Stable Diffusion plugin for Photoshop/Photopea based on A1111 API.

## Setup
Add `--cors-allow-origins http://localhost:5173` to WebUI command line args for local development.
Add `--cors-allow-origins https://huchenlei.github.io/stable-diffusion-ps-pea/` for production useage.

## Development plan

1. Basic UI setting for image generation
   - We should not distinguish txt2img and img2img. (Maybe txt2img in some advanced settings?). Fill on an empty selection should trigger txt2img, otherwise img2img.
   - Prompt input, various configuration input UI.
   - Get input from current photopea selection (Capture the selected content)
   - Sending inputs to A1111 API
   - Render the returned image on photopea canvas
   - Ckpt selection, VAE selection.
1. Prompt textbox
   - Auto complete (Self prompt use history and prompt use DB)
   - Templates (Default quality prompt, negative embeddings, etc)
   - Prompt token estimation (75/150/225)
   - LoRA selection (LoRA should be selected instead of being put into prompt ideally)
     - Automatically detect LoRA trigger words
1. ControlNet support
   - Select a layer, choose a preprocessor can convert it to ControlNet layer.
   - ControlNet layer will be used as ControlNet input
   - Black background of the preprocessor result will be replaced by transparent background
   - White lines, shapes will be inverted
1. Inpaint
   - Create a selection and hit generative fill will by default will trigger inpaint with reference to a reasonable context
(512x512?).
   - Provide another button (choose custom inpaint reference area besides inpaint button to let user specify another selection)

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

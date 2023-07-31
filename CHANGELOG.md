## Development plan

1. Basic UI setting for image generation
   - [*DONE*] We should not distinguish txt2img and img2img. (Maybe txt2img in some advanced settings?). Fill on an empty selection should trigger txt2img, otherwise img2img.
   - [*DONE*] Prompt input, various configuration input UI.
   - [*DONE*] Get input from current photopea selection (Capture the selected content)
   - [*DONE*] Sending inputs to A1111 API
   - [*DONE*] Render the returned image on photopea canvas
   - [*DONE*] Ckpt selection
   - [*DONE*] VAE selection.
   - [*DONE*] Generation progress bar.
   - Seed input
1. [*DONE*] Universal extension support
   - [*DONE*] Raw text input for extension's script args.
1. [*DONE*] Savable run configuration
   - [*DONE*] Reset button on generation page to reset everything to default
2. Prompt textbox
   - [*DONE*] Auto complete (Self prompt use history and prompt use DB)
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

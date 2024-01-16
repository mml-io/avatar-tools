# Using Mixamo characters on M-Squared Unreal Experiences

## About this guide:

This guide aims to show you how to use the [**`gltf-avatar-exporter`**](https://mml-io.github.io/avatar-tools/main/tools/gltf-avatar-exporter/) Avatar Tool to rig any character of your choice using [Blender](https://www.blender.org/download/) and the [Auto Rig Pro](https://blendermarket.com/products/auto-rig-pro) plugin, to get the character ready to be used in any M-Squared or Unreal experiences, and then how to use the [MML Editor](https://mmleditor.com) to create an `MML Character Description` with your brand new rigged model.

This documentation shows this process using an asset picked from [Mixamo](https://www.mixamo.com) as an example not only for being a well-known 3D character source but also as an opportunity to illustrate how to unparent a character's mesh from its current armature to create a new rig.

In case you're following this guide with a character that has no armature (just the 3D mesh with no skeleton, vertex groups, or modifiers), then steps `1` to `7` of the guide may be skipped.

The software versions being used while writing this guide are:
- Blender: `v3.6.5`
- Auto Rig Pro: `v3.68.71`

While older or newer versions may also work, these specific versions were the ones that produced consistent and high-quality results for this process (*you may request Auto Rig Pro authors to provide a download link for previous versions, and they will*)

### Download the character from Mixamo:

First, download any given character of your choice from [Mixamo](https://www.mixamo.com) by selecting a character and clicking on the Download button as in the screenshot below (with Format as `FBX Binary(.fbx)` and Pose as `T-Pose`).

![download from Mixamo](./screenshots/01_download_from_mixamo.png)

### Removing the original Character Armature:

1) After opening Blender, clear your scene by selecting all the objects in your `Scene Collection` > `Collection` by selecting them and pressing the `delete` key;

2) Import your download character to the scene by going to: `File` > `Import` > `gLTF 2.0 (.glb/.gltf)` (*leave all the import options as they are by default*);

3) Select your character's mesh by clicking it on the 3D viewport or by clicking on it on the `Scene Collection` right panel's list (the mesh will be located inside the character's `Armature`, and you can recognize it by the orange triangle icon to the left of its name);

4) After selecting the mesh (an orange outline will appear around it on the 3D viewport), press `Alt + p` with your mouse cursor over the 3D viewport to open the `Clear Parent` menu. Then select the option `Clear and Keep Transformation` as seen in the screenshot below:

![clear parent and keep transformation](./screenshots/02_blender_geometry_clear_and_keep_transformation.png)

5) Once you have done that, you'll see on the `Scene Collection` right panel's list that the character's mesh is not parented to the `Armature` anymore (they became siblings in the list, as seen in the screenshot below), and now you can safely select the `Armature` on the list and press the `delete` key  to delete it;

![delete the original Armature](./screenshots/03_blender_delete_original_armature.png)

6) For good measure, unfold your character's mesh item on the `Scene Collection` right panel's list, click on `Vertex Groups` to select it, and on the lower half of the right panel, first click the `Data` tab (green triangle icon on the left of the panel) click the little down arrow that appears to the right of the `Vertex Groups` list to open the actions menu, and click on `Delete All Groups` (as seen in the screenshot below):

![delete All Vertex Groups](./screenshots/04_blender_delete_all_vertex_groups.png)


7) Still for good measure, click on `Modifiers` on the upper part of the `Scene Collection` right panel, and on the lower half of the right panel, first, select the `Modifiers` tab (blue wrench icon), and then click on the X to the right of any Modifier card you may see (as seen in the screenshot below):

![delete Modifiers](./screenshots/05_blender_delete_modifiers.png)

8) Still with your character's mesh selected, place your mouse cursor over the 3D viewport, press `Ctrl + a` to open the `Apply` menu, and then click on `All Transforms` to reset all of your character's transforms (location, rotation, and scale), as seen in the screenshot below:

![Apply All Transforms](./screenshots/06_blender_apply_all_transforms.png)

9) Now open the `App` tab (it stays between the 3D Viewport and the right panel when you drag the little arrow pointing right) to show the `Auto Rig Pro` panel, and with your character's mesh selected, unfold `Auto-Rig Pro: Smart` and then, click on `Get Selected Objects`. You'll then see a `Smart` options selector. Leave it as default (with `Full Body` selected), and then click `OK` as seen in the screenshot below:

![Auto-Rig Pro Smart](./screenshots/07_blender_auto-rig_pro_smart.png)

10) Once that's done, you'll see your character from its front, with an orthographic perspective, and that's to facilitate selecting the key points of your rig on the Auto-Rig Pro rigging process. To start the process, click on `Add Neck` as in the screenshot below:

![Auto-Rig Pro Select Key Points](./screenshots/08_blender_auto-rig_pro_select_key_points.png)

11) Once `Add Neck` is clicked, you'll see your cursor with a green dot on it on the 3D viewport, and you'll use this green dot to mark the key places on your character, which are: `Neck`, `Chin`, `Shoulders`, `Wrists`, `Spine Root`, and `Ankles`. Once you mark the position for each key part of this list, you'll see the button to `Add` the next one. Click it, and mark the next one, until you marked them all. Once you finish this process for all the key places, you'll have a result similar to the screenshot below:

![Auto-Rig Pro Key Points Selected](./screenshots/09_blender_auto-rig_pro_key_points_selected.png)

12) Once you finished that, you'll notice that the Auto-Rig Pro panel has changed and now has further options. Search for the `Skeleton Setting Pressets:` dropdown list option, and use it to select the `UE5 Manny-Quinn` option (as seen in the screenshot above) leaving all the other options as they are by default, and then press the button `Go` (this process may take a few seconds depending on your computer's performance).

13) After doing that, you'll see that your body part markings on the 3D Viewport will be replaced by your New Rig Skeleton (that should be well aligned with your character's mesh, as seen in the screenshot below). Then just click on `Match to Rig` to finish your Rig Creation process (this may also take a few seconds to execute. Please be patient);

![Auto-Rig Pro Match to Rig](./screenshots/10_blender_auto-rig_pro_match_to_rig.png)


14) After you see your new Rig on the 3D Viewport, you'll select your character's mesh by clicking it (an orange outline will appear around it), then, while holding the `Shift` key, you'll select your Rig (you can do it by clicking the cyan circle above the character's head). After selecting both, click on the `Skin` tab on the Auto-Rig Pro's panel, look for the `Engine:` dropdown list option, and select `Voxelized` (as seen in the screenshot below) while leaving all the rest of the options as they are by default, and click on the `Bind` button to bind your new Rig to your character's mesh (this may also take a few seconds);

![Auto-Rig Pro Bind Rig](./screenshots/11_blender_auto-rig_pro_bind_rig.png)

15) After doing that, you'll unfold the `Auto-Rig Pro: Export` section, which is the last option on the Auto-Rig Pro panel, and click on the `Export GLTF...` button as in the screenshot below:

![Auto-Rig Export](./screenshots/12_blender_auto-rig_pro_export.png)

16) In the Blender File View, you'll see after clicking on the Export, you'll give your file a name, and carefully check some parameters we need to use to export the file with the right conditions. Please follow the list below:

> 1) Leave `Format:` as it is by default in such file viewer (`gLTF Binary (.glb)`);
> 2) Right under it, there's a drop-down selector that will probably have `Unity` by default. You'll click on it and select the `Unreal Engine` option;
> 3) Right under it, select `Humanoid` instead of Universal (which probably is selected by default);
> 4) Click the `Fix Rig` button, and then click `OK` on the Info panel that will show all the operations that were applied;
> 5) Right under the `Fix Rig` button, select the `Animations` tab (to the right of the `Rig` tab that is selected by default), and when on it, `unckeck` the `Bake Animations` option (which will probably be checked by default), and then click back on the `Rig` tab so we can configure the remaining options;
> 6) Back on the `Rig` tab, in the bottom part of the panel, you have to `check` three options to activate them. `check` the options: `Rename for UE`, `Mannequin Axes`, and `Add IK Bones`. Once you enable those three options, you can click on the `Auto-Rig Pro GLTF Exporter` button. In the end of the process, all your options should look like in the screenshot below:

![Auto-Rig Export Options](./screenshots/13_blender_auto-rig_pro_export_options.png)


17) Now that you have your file properly rigged and exported from Blender, you're ready to open the [**`gltf-avatar-exporter`**](https://mml-io.github.io/avatar-tools/main/tools/gltf-avatar-exporter/) Avatar Tool, and then you just need to drag the file you just exported to the top-left quadrant of the tool. You'll then see the preview of your model, and if you want to, you may click on the `Use Sample Animation` and `Toggle Slow Motion` buttons to preview your character with an animation playing to see how your new Rig deforms. You may also `uncheck` the `Debug` options (in the lower part of the top-right quadrant of the tool) to disable the debugging lines on the preview viewport. Once you're happy previewing your file, click on the `Export` button, as seen in the screenshot below:

![GLTF Avatar Exporter Tool](./screenshots/14_gltf-avatar-exporter_tool.png)

18) Now you can navigate to the [MML Editor](https://mmleditor.com), where you'll click on the `Create Project` button, as seen in the screenshot below:

![MML Editor](./screenshots/15_mml_editor.png)

19) Once your New Project window is open, just drag the file you just exported from the `GLTF Avatar Exporter Tool` to upload the asset to the `MML Editor`, and then click on the `Upload` button.

20) Once uploaded, you may find your asset on the `Assets` tab (on the upper-left part of the screen, to the right of the `Scene` tab), and then you can drag its card from the `Assets` list and drop it on the lower-left quadrant of the `MML Editor`, as seen in the screenshot below. By doing that, you'll immediately see the `<m-model>` tag with an `src` atribute that contains an `mmlstorage URL` to your model, and you'll also see your character appearing on both of the top quadrants of the screen.

21) Now, on the `CODE` quadrant (the lower-left one), rename both the opening and closing `<m-model>` tags to `<m-character>` tags, as seen in the screenshot below. After renaming the tags, click on the `Static Versions` button on the upper right part of the screen;


![MML Editor <m-character> tags](./screenshots/16_mml_editor_m-character.png)

22) After clicking the `Static Versions` button, you'll see the `Static Versions` modal. Then you may click on the `Publish` button to publish your MML Document, and you'll immediately see the `Existing Static Versions` list with your published static MML Document, where you can click the `Copy` button to copy the URL of your MML document to your clipboard. That's the address you'll use to import your MML Character to any M-Squared Experiences.

![MML Editor Publish](./screenshots/17_mml_editor_publish.png)

🥳🎉 **Congratulations!** Now you have your static `MML Document` published through the `MML Editor` ready to use. Have fun!

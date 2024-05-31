bl_info = {
    "name": "Improbable Geometry Processor",
    "author": "Felipe Pesantez",
    "version": (0,0,1),
    "blender": (3,5,0),
    "location": "3D Viewport > Sidebar > Improbable geometry process",
    "description": "Metaverse Avatar geometry process",
    "category": "Development",
}

import bpy
import mathutils
import os
import webbrowser


def createUECube():
    bpy.ops.mesh.primitive_cube_add(enter_editmode=False, align='WORLD', location=(0, 0, 1), scale=(0.89, 0.89, 0.89))
    bpy.context.active_object.location.z -= 0.1


def removeArmature(armature_name):
    # Get all mesh objects in the scene
    all_objects = [obj for obj in bpy.context.scene.objects]

    # Select all mesh objects
    for obj in all_objects:
        obj.select_set(True)

    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    # Loop through all objects in the scene
    for obj in bpy.data.objects:
        # Check if the object is a mesh
        if obj.type == 'MESH':
            # Loop through each modifier in the object
            for modifier in obj.modifiers:
                # If the modifier is an armature and its name matches, remove it
                if modifier.type == 'ARMATURE' and modifier.object.name == armature_name:
                    obj.modifiers.remove(modifier)
                    # Break the loop if you assume there's only one armature modifier per object
                    break

            # Remove all vertex groups from the mesh
            obj.vertex_groups.clear()

    # Optional: Remove the armature object itself if it's no longer needed
    if armature_name in bpy.data.objects:
        armature = bpy.data.objects[armature_name]
        bpy.data.objects.remove(armature, do_unlink=True)



def merge_and_delete_transform_groups(obj):
    # Select the object and enter edit mode
    bpy.context.view_layer.objects.active = obj

    # Clear parent and keep transformation
    obj.matrix_world = obj.matrix_world @ obj.matrix_parent_inverse
    obj.matrix_basis.identity()
    obj.parent = None
    obj.matrix_world.identity()

def scale_object_to_fit():
    # Get the selected objects
    selected_objects = bpy.context.selected_objects

    # Check if there are at least two selected objects
    if len(selected_objects) < 2:
        print("Select at least two objects.")
        return

    # Get the dimensions of the last two selected objects

    object_a = selected_objects[-2]
    object_b = selected_objects[-1]

    # Get the dimensions of objectB
    bounding_box = object_b.bound_box
    max_dimensions = [max(bounding_box[i][j] for i in range(8)) for j in range(3)]

    # Find the maximum dimension of objectB
    max_scale = max(max_dimensions)

    # Calculate the scaling factor
    scale_factor = max_scale / max(object_a.dimensions)
    scale_factor *= 2

    # Apply the scaling to objectA
    object_a.scale = (scale_factor, scale_factor, scale_factor)

def cleanup_geo():
    # Get all mesh objects in the scene
    all_objects = [obj for obj in bpy.context.scene.objects]

    # Select all mesh objects
    for obj in all_objects:
        obj.select_set(True)

    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    # Clear existing selection
    bpy.ops.object.select_all(action='DESELECT')

    # Get all mesh objects in the scene
    mesh_objects = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']

    # Select all mesh objects
    for obj in mesh_objects:
        obj.select_set(True)

    # Print the names of selected mesh objects (optional)
    selected_mesh_names = [obj.name for obj in bpy.context.selected_objects]
    print("Selected Mesh Objects:", selected_mesh_names)

    for object in mesh_objects:

        object_name = object.name

        # Get the object by name
        obj = bpy.data.objects.get(object_name)

        if obj:
            # Check if the object has any parent
            if obj.parent:
                # Apply the parent inverse to clear transformations
                obj.matrix_world = obj.matrix_world @ obj.matrix_parent_inverse
                obj.parent = None
            try:
                # Delete transform groups
                for group in obj.users_group:
                    bpy.data.groups.remove(group)
            except:
                pass

            # Merge and delete transform groups
            merge_and_delete_transform_groups(obj)
        else:
            print(f"Object with name '{object_name}' not found.")


    other_objects = [obj for obj in bpy.context.scene.objects if obj.type != 'MESH']

    for obj in other_objects:
        bpy.data.objects.remove(obj, do_unlink=True)

    bpy.ops.object.join()

def mergeVertices():
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.remove_doubles()
    bpy.ops.object.mode_set(mode='OBJECT')

#texture resize step
def _resize_image(image, max_size):
    if image:
        width, height = image.size
        if width > max_size or height > max_size:
            scale_factor = max_size / max(width, height)
            new_width = int(width * scale_factor)
            new_height = int(height * scale_factor)
            image.scale(new_width, new_height)

def image_res_checkup():
    for material in bpy.data.materials:
        if material.node_tree:
            for node in material.node_tree.nodes:
                if node.type == 'TEX_IMAGE':
                    if node.image:
                        _resize_image(node.image, 1000)

#material converter
def check_texture_nodes(material):
    texture_nodes = []
    if material.node_tree is not None:
        for node in material.node_tree.nodes:
            if node.type == 'TEX_IMAGE':
                texture_nodes.append(node)
    return texture_nodes

def filter_texture_nodes(texture_nodes):
    for node in texture_nodes:
        if "base" in node.name.lower() or "color" in node.name.lower() or "diffuse" in node.name.lower():
            return node

def has_principled_node(material):
    if material.node_tree is not None:
        for node in material.node_tree.nodes:
            if node.type == 'BSDF_PRINCIPLED':
                return True
    return False

# Function to create a Principled BSDF node if it doesn't exist
def create_principled_node(material):
    if material.node_tree is None:
        material.use_nodes = True
    tree = material.node_tree
    principled = None
    for node in tree.nodes:
        if node.type == 'BSDF_PRINCIPLED':
            principled = node
            break
    if principled is None:
        principled = tree.nodes.new('ShaderNodeBsdfPrincipled')
        principled.location = (0, 0)
    return principled

def material_converter():
    # Loop through each material in the scene
    principled = None
    texture_node = None

    for material in bpy.data.materials:
        print("Material:", material.name)

        if not has_principled_node(material):
            principled = create_principled_node(material)

        texture_nodes = check_texture_nodes(material)
        if texture_nodes and principled:
            #texture_node = filter_texture_nodes(texture_nodes)
            texture_node = texture_nodes[0]
            links = material.node_tree.links
            link = links.new(texture_node.outputs["Color"], principled.inputs["Base Color"])

        if principled:
            principled.inputs["Roughness"].default_value = 0.8

            output_node = None
            for node in material.node_tree.nodes:
                if node.type == "OUTPUT_MATERIAL":
                    output_node = node
                    break

            if output_node:
                links = material.node_tree.links
                link = links.new(principled.outputs["BSDF"], output_node.inputs["Surface"])


class MESH_OT_ue_cube(bpy.types.Operator):
    """Creates a cube with the UE skeleton unit scale for reference"""
    bl_idname = "cube.cube_id"
    bl_label = "Cube with UE skeleton scale"
    bl_options = {"REGISTER", "UNDO"}


    def execute(self, context):
        createUECube()

        return {"FINISHED"}

class MESH_OT_clean_armature(bpy.types.Operator):
    """Removes the skeleton armature and clears all vertex groups"""
    bl_idname = "armature.armature_id"
    bl_label = "Skeleton Rig cleanup"
    bl_options = {"REGISTER", "UNDO"}


    skeleton_name: bpy.props.StringProperty(
        name="Armature Name",
        default="Armature",
        description="Name of the armature in the scene"
    )


    def execute(self, context):
        removeArmature(self.skeleton_name)

        return {"FINISHED"}

class MESH_OT_clean_geom_transforms(bpy.types.Operator):
    """Clears all transform groups and places the meshes at the root hierarchy level"""
    bl_idname = "mesh.mesh_id"
    bl_label = "Geometry transform cleanup"
    bl_options = {"REGISTER", "UNDO"}

    """
    user_name: bpy.props.StringProperty(
        name="User Name",
        default="Felipe",
        description="Name of the user"
    )
    """

    def execute(self, context):
        cleanup_geo()
        #mergeVertices()

        return {"FINISHED"}

class MESH_OT_match_transforms(bpy.types.Operator):
    """Match the bound scale from B to A"""
    bl_idname = "scale.scale_id"
    bl_label = "Geometry bound match transform"
    bl_options = {"REGISTER", "UNDO"}


    def execute(self, context):
        scale_object_to_fit()

        return {"FINISHED"}


class MESH_OT_merge_vertices(bpy.types.Operator):
    """Merge unconnected vertices by distance"""
    bl_idname = "merge.merge_id"
    bl_label = "Merge Vertices"
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        mergeVertices()

        return {"FINISHED"}

class MESH_OT_material_converter(bpy.types.Operator):
    """Converts any material to a Principled BSDF"""
    bl_idname = "mat_conv.mat_conv_id"
    bl_label = "Material Converter"
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        material_converter()

        return {"FINISHED"}

class MESH_OT_export_glb(bpy.types.Operator):
    """Performs all the checks and exports a GLB file, set location and name below"""
    bl_idname = "export.export_id"
    bl_label = "Check Texture Scale"
    bl_options = {"REGISTER", "UNDO"}


    def execute(self, context):
        image_res_checkup()
        applyTransforms()
        export_glb(context)

        return {"FINISHED"}

class OpenURLOperatorAvatar(bpy.types.Operator):
    bl_idname = "wm.open_url"
    bl_label = "Open Web Avatar Exporter"
    url: bpy.props.StringProperty(default="https://mml-io.github.io/avatar-tools/main/tools/gltf-avatar-exporter/")

    def execute(self, context):
        webbrowser.open_new_tab(self.url)
        return {'FINISHED'}

class OpenURLOperatorMML(bpy.types.Operator):
    bl_idname = "wm.open_mml_url"
    bl_label = "Open MML editor"
    url: bpy.props.StringProperty(default="https://mmleditor.com/projects")

    def execute(self, context):
        webbrowser.open_new_tab(self.url)
        return {'FINISHED'}

class VIEW3D_PT_geometry_process_panel(bpy.types.Panel):
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"

    bl_category = "Improbable geometry process"
    bl_label = "Geometry Process Panel"

    def draw(self, context):
        row = self.layout.row()
        row.operator("cube.cube_id", text="Add UE Cube")

        self.layout.separator()

        row = self.layout.row()
        row.operator("armature.armature_id", text="Remove Armature")
        row = self.layout.row()
        row.operator("mesh.mesh_id", text="Remove Transform Groups")
        row = self.layout.row()
        row.operator("merge.merge_id", text="Merge Vertices")
        row = self.layout.row()
        row.operator("scale.scale_id", text="Match Scale")
        row = self.layout.row()
        row.operator("mat_conv.mat_conv_id", text="Convert Materials")

        self.layout.separator()
        row = self.layout.row()
        scene = context.scene

        self.layout.prop(scene, "glb_export_directory")
        self.layout.prop(scene, "glb_export_filename")
        row.operator("export.export_id", text="Export GLB")

        self.layout.separator()
        self.layout.operator("wm.open_url")
        self.layout.operator("wm.open_mml_url")

bpy.types.Scene.glb_export_directory = bpy.props.StringProperty(
    name="Export Directory",
    subtype='DIR_PATH',
    default="//",
    description="Directory to export the .glb file"
)

bpy.types.Scene.glb_export_filename = bpy.props.StringProperty(
    name="Filename",
    default="exported_model",
    description="Filename for the exported .glb file"
)

def applyTransforms():
    objects_to_export = bpy.context.selected_objects
    for obj in objects_to_export:
        obj.select_set(True)

    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

def export_glb(context):
    output_directory = bpy.path.abspath(context.scene.glb_export_directory)
    output_filename = context.scene.glb_export_filename + ".glb"
    output_path = os.path.join(output_directory, output_filename)

    bpy.ops.export_scene.gltf(filepath=output_path, export_format='GLB', use_selection=True, export_apply=True)

    print("Exported to:", output_path)


def register():
    bpy.utils.register_class(VIEW3D_PT_geometry_process_panel)
    bpy.utils.register_class(MESH_OT_ue_cube)
    bpy.utils.register_class(MESH_OT_clean_armature)
    bpy.utils.register_class(MESH_OT_clean_geom_transforms)
    bpy.utils.register_class(MESH_OT_match_transforms)
    bpy.utils.register_class(MESH_OT_merge_vertices)
    bpy.utils.register_class(MESH_OT_material_converter)
    bpy.utils.register_class(MESH_OT_export_glb)
    bpy.utils.register_class(OpenURLOperatorAvatar)
    bpy.utils.register_class(OpenURLOperatorMML)

def unregister():
    bpy.utils.unregister_class(VIEW3D_PT_geometry_process_panel)
    bpy.utils.unregister_class(MESH_OT_ue_cube)
    bpy.utils.unregister_class(MESH_OT_clean_armature)
    bpy.utils.unregister_class(MESH_OT_clean_geom_transforms)
    bpy.utils.unregister_class(MESH_OT_match_transforms)
    bpy.utils.unregister_class(MESH_OT_merge_vertices)
    bpy.utils.unregister_class(MESH_OT_material_converter)
    bpy.utils.unregister_class(MESH_OT_export_glb)
    bpy.utils.unregister_class(OpenURLOperatorAvatar)
    bpy.utils.unregister_class(OpenURLOperatorMML)


if __name__ == "__main__":
    register()

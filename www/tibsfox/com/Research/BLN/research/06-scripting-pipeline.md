# Python Scripting, Add-on Development & Pipeline

Module: **SCRIPT-PIPE** | Series: Blender User Manual | Status: Reference Document

---

## Table of Contents

1. [Blender's Embedded Python Interpreter](#1-blenders-embedded-python-interpreter)
2. [The bpy Module](#2-the-bpy-module)
3. [mathutils: Vectors, Matrices, and Rotations](#3-mathutils-vectors-matrices-and-rotations)
4. [The Scripting Workspace and Text Editor](#4-the-scripting-workspace-and-text-editor)
5. [Writing Operators](#5-writing-operators)
6. [Writing Panels](#6-writing-panels)
7. [Writing Menus and Pie Menus](#7-writing-menus-and-pie-menus)
8. [Add-on Structure](#8-add-on-structure)
9. [Add-on Preferences and User Properties](#9-add-on-preferences-and-user-properties)
10. [Complete Script Examples](#10-complete-script-examples)
11. [Pipeline Integration](#11-pipeline-integration)
12. [Production Management Integration](#12-production-management-integration)
13. [Asset Libraries and Linking](#13-asset-libraries-and-linking)
14. [Flamenco Render Farm](#14-flamenco-render-farm)
15. [Running Blender Headlessly](#15-running-blender-headlessly)
16. [Common Pitfalls and Practical Tips](#16-common-pitfalls-and-practical-tips)
17. [Sources](#17-sources)

---

## 1. Blender's Embedded Python Interpreter

### 1.1 Overview

Blender ships with a complete **CPython interpreter** embedded within the application. This Python environment has full access to Blender's data, operators, and UI through the `bpy` module. Every action you perform in Blender's GUI is backed by a Python operator that can be called from scripts [1][2].

As of Blender 4.4, the embedded interpreter is **Python 3.11**. Blender's Python environment is isolated from any system Python installation -- it uses its own bundled Python binary and standard library [1].

### 1.2 Where Python Runs in Blender

| Context | Description |
|---------|-------------|
| **Python Console** | Interactive REPL in the Python Console editor (for testing one-liners) |
| **Text Editor** | Multi-line scripts run via the Run Script button or **Alt+P** |
| **Startup Scripts** | Scripts in Blender's scripts/startup/ directory run on launch |
| **Add-ons** | Installed via Preferences > Add-ons; registered on enable |
| **Drivers** | Python expressions evaluated per-frame for driven properties |
| **Application Handlers** | Callback functions registered for events (frame change, render, file load) |
| **Command Line** | `blender --python script.py` runs scripts without user interaction |
| **Modal Operators** | Long-running operators that update every frame or input event |

### 1.3 Python Console Quick Reference

Open the Python Console editor and type commands directly:

```python
# List all objects in the scene
for obj in bpy.data.objects:
    print(obj.name, obj.type)

# Get the active object
obj = bpy.context.active_object
print(obj.location)

# Move the active object
bpy.context.active_object.location.x += 2.0

# Add a cube
bpy.ops.mesh.primitive_cube_add(location=(0, 0, 3))
```

### 1.4 Tooltip and Info Editor

**Tooltips:** Hovering over any UI element and pressing **Ctrl+C** copies the Python path for that property. Hovering shows the Python identifier in the tooltip.

**Info Editor:** Every operation you perform in Blender is logged as a Python command in the Info editor. This is the fastest way to discover the Python equivalent of a GUI action [1].

---

## 2. The bpy Module

### 2.1 bpy.data

`bpy.data` provides access to **all data blocks** in the current .blend file. This is the gateway to every mesh, material, texture, image, armature, camera, light, scene, and world in the file [1][2].

```python
import bpy

# Access all meshes
for mesh in bpy.data.meshes:
    print(mesh.name, len(mesh.vertices), "verts")

# Access a specific object by name
cube = bpy.data.objects["Cube"]
print(cube.location)

# Access materials
for mat in bpy.data.materials:
    print(mat.name)

# Create a new material
mat = bpy.data.materials.new(name="MyMaterial")
mat.use_nodes = True

# Remove an object (unlink first, then remove data)
bpy.data.objects.remove(bpy.data.objects["Cube"], do_unlink=True)
```

Key `bpy.data` collections:

| Collection | Data Type |
|------------|-----------|
| `bpy.data.objects` | All objects (mesh, empty, camera, light, armature, etc.) |
| `bpy.data.meshes` | Mesh data blocks |
| `bpy.data.materials` | Materials |
| `bpy.data.textures` | Textures |
| `bpy.data.images` | Images |
| `bpy.data.cameras` | Camera data |
| `bpy.data.lights` | Light data |
| `bpy.data.armatures` | Armature data |
| `bpy.data.actions` | Animation Actions |
| `bpy.data.scenes` | Scenes |
| `bpy.data.worlds` | World environments |
| `bpy.data.node_groups` | Shader/Geometry Node groups |
| `bpy.data.collections` | Scene collections |
| `bpy.data.curves` | Curve data |
| `bpy.data.fonts` | Font data |
| `bpy.data.particles` | Particle system settings |

### 2.2 bpy.ops

`bpy.ops` contains **operators** -- callable functions that perform actions. Every button, menu item, and tool in Blender maps to an operator [1][2].

```python
import bpy

# Add a UV sphere
bpy.ops.mesh.primitive_uv_sphere_add(radius=1.0, location=(0, 0, 0))

# Select all objects
bpy.ops.object.select_all(action='SELECT')

# Delete selected objects
bpy.ops.object.delete()

# Switch to edit mode
bpy.ops.object.mode_set(mode='EDIT')

# Export as FBX
bpy.ops.export_scene.fbx(filepath="/tmp/output.fbx")

# Render an image
bpy.ops.render.render(write_still=True)
```

**Important:** Operators require specific contexts. An operator designed for Edit Mode will fail if called in Object Mode. Use **context overrides** to handle this:

```python
# Context override example (Blender 4.0+ style)
with bpy.context.temp_override(area=area, region=region):
    bpy.ops.mesh.subdivide(number_cuts=2)
```

**Operator Return Values:**

| Return | Meaning |
|--------|---------|
| `{'FINISHED'}` | Operation completed successfully |
| `{'CANCELLED'}` | Operation was cancelled |
| `{'RUNNING_MODAL'}` | Operator entered modal state (continues running) |
| `{'PASS_THROUGH'}` | Event was not handled, pass to other handlers |

### 2.3 bpy.context

`bpy.context` provides **read-only access** to the current state of Blender -- what is selected, what mode is active, what the active object is, etc. [1][2]

```python
import bpy

# Current mode
print(bpy.context.mode)  # 'OBJECT', 'EDIT_MESH', 'POSE', etc.

# Active object
obj = bpy.context.active_object
print(obj.name)

# Selected objects
for obj in bpy.context.selected_objects:
    print(obj.name)

# Current scene
scene = bpy.context.scene
print(scene.frame_current)

# View layer
vl = bpy.context.view_layer
print(vl.name)
```

### 2.4 bpy.props

`bpy.props` defines **custom properties** for operators, panels, and add-on classes. These create UI-visible, serializable properties [2].

| Property Type | Python Type | UI Widget |
|---------------|-------------|-----------|
| `BoolProperty` | bool | Checkbox |
| `BoolVectorProperty` | tuple of bool | Multiple checkboxes |
| `IntProperty` | int | Number field / slider |
| `IntVectorProperty` | tuple of int | Multiple number fields |
| `FloatProperty` | float | Number field / slider |
| `FloatVectorProperty` | tuple of float | Number fields / color picker (subtype) |
| `StringProperty` | str | Text field |
| `EnumProperty` | str (identifier) | Dropdown / radio buttons |
| `PointerProperty` | reference | Data-block selector |
| `CollectionProperty` | list | Expandable list |

```python
import bpy
from bpy.props import FloatProperty, EnumProperty, StringProperty

class MyOperator(bpy.types.Operator):
    bl_idname = "object.my_operator"
    bl_label = "My Operator"

    scale: FloatProperty(
        name="Scale",
        description="Scale factor",
        default=1.0,
        min=0.01,
        max=100.0,
    )

    mode: EnumProperty(
        name="Mode",
        items=[
            ('FAST', "Fast", "Quick processing"),
            ('QUALITY', "Quality", "High quality processing"),
        ],
        default='FAST',
    )

    def execute(self, context):
        print(f"Scale: {self.scale}, Mode: {self.mode}")
        return {'FINISHED'}
```

### 2.5 bpy.types

`bpy.types` contains **all Blender type definitions** -- every class that represents a Blender data structure. Custom operators, panels, menus, and node types inherit from `bpy.types` base classes [2].

Key base classes:

| Class | Purpose |
|-------|---------|
| `bpy.types.Operator` | Base for custom operators |
| `bpy.types.Panel` | Base for UI panels |
| `bpy.types.Menu` | Base for dropdown menus |
| `bpy.types.Header` | Base for editor headers |
| `bpy.types.UIList` | Base for scrollable lists in the UI |
| `bpy.types.PropertyGroup` | Base for custom grouped properties |
| `bpy.types.AddonPreferences` | Base for add-on preference panels |
| `bpy.types.NodeTree` | Base for custom node trees |
| `bpy.types.Node` | Base for custom nodes |
| `bpy.types.RenderEngine` | Base for custom render engines |

### 2.6 bpy.app

`bpy.app` provides **application-level information and handlers** [2]:

```python
import bpy

# Blender version
print(bpy.app.version)          # (4, 4, 0)
print(bpy.app.version_string)   # "4.4.0"

# File path
print(bpy.app.binary_path)      # Path to blender executable

# Application handlers (callbacks)
def on_frame_change(scene):
    print(f"Frame: {scene.frame_current}")

bpy.app.handlers.frame_change_post.append(on_frame_change)

# Available handlers:
# frame_change_pre, frame_change_post
# render_pre, render_post, render_complete, render_cancel
# load_pre, load_post
# save_pre, save_post
# depsgraph_update_pre, depsgraph_update_post
# undo_pre, undo_post
```

### 2.7 bpy.path

`bpy.path` provides **file path utilities** specific to Blender's path conventions (// for relative paths, etc.) [2]:

```python
import bpy

# Resolve a Blender-relative path to absolute
abs_path = bpy.path.abspath("//textures/diffuse.png")

# Make a path relative to the .blend file
rel_path = bpy.path.relpath("/home/user/project/textures/diffuse.png")

# Clean up a file path
clean = bpy.path.clean_name("My Object: Version 2")  # "My_Object__Version_2"
```

---

## 3. mathutils: Vectors, Matrices, and Rotations

### 3.1 Overview

The `mathutils` module provides mathematical types for 3D transformations. It is tightly integrated with Blender's data structures -- object locations, rotations, and scales are all `mathutils` types [3].

### 3.2 Vector

```python
from mathutils import Vector

# Create vectors
v1 = Vector((1.0, 2.0, 3.0))
v2 = Vector((4.0, 5.0, 6.0))

# Operations
v3 = v1 + v2              # Vector addition
v4 = v1 - v2              # Vector subtraction
v5 = v1 * 2.0             # Scalar multiplication
v6 = v1.cross(v2)         # Cross product
dot = v1.dot(v2)          # Dot product
length = v1.length        # Magnitude
normalized = v1.normalized()  # Unit vector

# Component access
x, y, z = v1.x, v1.y, v1.z
v1.xy                     # 2D slice (Vector((1.0, 2.0)))

# Distance between points
dist = (v1 - v2).length

# Linear interpolation
v_mid = v1.lerp(v2, 0.5)  # Midpoint
```

### 3.3 Matrix

```python
from mathutils import Matrix, Vector
import math

# Identity matrix
m = Matrix.Identity(4)

# Translation matrix
m_translate = Matrix.Translation(Vector((1.0, 2.0, 3.0)))

# Rotation matrix (angle in radians, axis)
m_rotate = Matrix.Rotation(math.radians(45), 4, 'Z')

# Scale matrix
m_scale = Matrix.Diagonal(Vector((2.0, 2.0, 2.0, 1.0)))

# Combine transforms (matrix multiplication, order matters!)
# Scale first, then rotate, then translate:
m_combined = m_translate @ m_rotate @ m_scale

# Apply to a vector
v = Vector((1.0, 0.0, 0.0))
v_transformed = m_combined @ v

# Invert a matrix
m_inv = m_combined.inverted()

# Decompose into components
loc, rot, scale = m_combined.decompose()
# loc = Vector, rot = Quaternion, scale = Vector
```

### 3.4 Quaternion

```python
from mathutils import Quaternion, Vector
import math

# Create from axis-angle
q = Quaternion(Vector((0, 0, 1)), math.radians(90))  # 90 degrees around Z

# Create from Euler
from mathutils import Euler
euler = Euler((math.radians(45), 0, 0), 'XYZ')
q = euler.to_quaternion()

# Multiply quaternions (combines rotations)
q1 = Quaternion(Vector((1, 0, 0)), math.radians(45))
q2 = Quaternion(Vector((0, 1, 0)), math.radians(30))
q_combined = q1 @ q2

# Spherical interpolation (slerp)
q_mid = q1.slerp(q2, 0.5)

# Rotate a vector
v = Vector((1, 0, 0))
v_rotated = q @ v

# Convert to matrix
m = q.to_matrix().to_4x4()

# Conjugate and inverse
q_conj = q.conjugated()
q_inv = q.inverted()
```

### 3.5 Euler

```python
from mathutils import Euler
import math

# Create Euler angles (radians, rotation order)
e = Euler((math.radians(45), math.radians(30), math.radians(60)), 'XYZ')

# Access components
print(e.x, e.y, e.z)       # In radians
print(e.order)              # 'XYZ'

# Rotate around an axis
e.rotate_axis('Z', math.radians(15))

# Convert to other representations
q = e.to_quaternion()
m = e.to_matrix()

# Available rotation orders:
# 'XYZ', 'XZY', 'YXZ', 'YZX', 'ZXY', 'ZYX'
```

---

## 4. The Scripting Workspace and Text Editor

### 4.1 Scripting Workspace

Blender's **Scripting** workspace is pre-configured with:

| Panel | Purpose |
|-------|---------|
| **3D Viewport** | See results of script operations |
| **Text Editor** | Write and run Python scripts |
| **Python Console** | Interactive testing |
| **Info Editor** | View Python log of GUI operations |
| **Properties** | Standard properties panel |

### 4.2 Text Editor Features

| Feature | Shortcut | Description |
|---------|----------|-------------|
| **Run Script** | **Alt+P** | Execute the active text block |
| **Line Numbers** | (toggle in header) | Show line numbers |
| **Syntax Highlighting** | (automatic for .py) | Python syntax coloring |
| **Word Wrap** | (toggle in header) | Wrap long lines |
| **Find** | **Ctrl+F** | Search within the script |
| **Replace** | **Ctrl+H** | Find and replace |
| **Comment** | **Ctrl+/** | Toggle comment on selected lines |
| **Autocomplete** | **Ctrl+Space** | Basic code completion |
| **Register** | (checkbox in header) | Registers the script on file load |

### 4.3 External Editor Integration

For serious development, use an external IDE:

1. Save scripts as external .py files
2. Open them in VS Code, PyCharm, or any editor
3. Use the **fake-bpy-module** package for autocomplete: `pip install fake-bpy-module-4.4`
4. In Blender's Text Editor, use **Text > Open** to reference the external file
5. After editing externally, use **Text > Reload** or **Alt+R** to refresh

---

## 5. Writing Operators

### 5.1 Operator Anatomy

An operator is a Python class that inherits from `bpy.types.Operator` and defines how an action is performed [1][4]:

```python
import bpy

class OBJECT_OT_simple_example(bpy.types.Operator):
    """Tooltip: This operator does something useful"""

    bl_idname = "object.simple_example"    # Unique identifier
    bl_label = "Simple Example Operator"    # Display name
    bl_description = "Performs the example operation"  # Tooltip
    bl_options = {'REGISTER', 'UNDO'}       # Options set

    def execute(self, context):
        """Called when the operator runs."""
        self.report({'INFO'}, "Operation completed!")
        return {'FINISHED'}
```

### 5.2 bl_idname Naming Convention

The `bl_idname` follows the pattern: `CATEGORY.operator_name`

| Category | Use For |
|----------|---------|
| `object` | Object-level operations |
| `mesh` | Mesh editing operations |
| `view3d` | 3D Viewport operations |
| `render` | Rendering operations |
| `wm` | Window manager (dialogs, file browsers) |
| `import_scene` | File import |
| `export_scene` | File export |

Rules: lowercase only, words separated by underscores, single dot separator.

### 5.3 bl_options Flags

| Flag | Meaning |
|------|---------|
| `'REGISTER'` | Operator appears in the Info editor log and can be repeated with F3 |
| `'UNDO'` | Operation supports Ctrl+Z undo |
| `'BLOCKING'` | Operator blocks the UI while running |
| `'INTERNAL'` | Hidden from search and menus; only callable from other scripts |
| `'PRESET'` | Enables the preset system in the operator's redo panel |

### 5.4 Operator Methods

| Method | When Called | Must Return |
|--------|------------|-------------|
| `execute(self, context)` | When the operator runs directly | `{'FINISHED'}`, `{'CANCELLED'}` |
| `invoke(self, context, event)` | When the operator is called from the UI (allows user input first) | `{'FINISHED'}`, `{'CANCELLED'}`, `{'RUNNING_MODAL'}` |
| `modal(self, context, event)` | Called repeatedly for modal operators (every input event / timer) | `{'RUNNING_MODAL'}`, `{'FINISHED'}`, `{'CANCELLED'}`, `{'PASS_THROUGH'}` |
| `draw(self, context)` | Draws the redo panel / popup UI | None |
| `poll(cls, context)` | Class method called to check if operator can run in current context | True/False |
| `cancel(self, context)` | Called when a modal operator is cancelled | None |

### 5.5 The poll() Method

`poll()` is a `@classmethod` that Blender calls to determine whether the operator's button should be active (enabled) in the UI:

```python
@classmethod
def poll(cls, context):
    # Only enable if there is an active object and it's a mesh
    return (context.active_object is not None and
            context.active_object.type == 'MESH')
```

### 5.6 invoke() for User Interaction

`invoke()` is called when the user activates the operator through the UI. It can open dialogs, file browsers, or enter modal state:

```python
def invoke(self, context, event):
    # Open a popup dialog with operator properties
    return context.window_manager.invoke_props_dialog(self)

# Or open a file browser
def invoke(self, context, event):
    context.window_manager.fileselect_add(self)
    return {'RUNNING_MODAL'}
```

### 5.7 Modal Operators

Modal operators run continuously, receiving input events until they finish or are cancelled. Used for interactive tools, viewport drawing, and progress tracking:

```python
class OBJECT_OT_modal_timer(bpy.types.Operator):
    bl_idname = "object.modal_timer"
    bl_label = "Modal Timer Operator"

    _timer = None

    def modal(self, context, event):
        if event.type == 'TIMER':
            # Do periodic work
            print("Timer tick")
        elif event.type == 'ESC':
            self.cancel(context)
            return {'CANCELLED'}
        return {'RUNNING_MODAL'}

    def invoke(self, context, event):
        self._timer = context.window_manager.event_timer_add(
            0.1, window=context.window
        )
        context.window_manager.modal_handler_add(self)
        return {'RUNNING_MODAL'}

    def cancel(self, context):
        context.window_manager.event_timer_remove(self._timer)
```

---

## 6. Writing Panels

### 6.1 Panel Anatomy

Panels create UI sections in Blender's Properties editor, sidebar (N-panel), or other editor regions [4]:

```python
import bpy

class VIEW3D_PT_my_panel(bpy.types.Panel):
    bl_label = "My Custom Panel"
    bl_idname = "VIEW3D_PT_my_panel"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = "My Tools"      # Tab name in the sidebar

    def draw(self, context):
        layout = self.layout
        obj = context.active_object

        if obj:
            layout.label(text=f"Active: {obj.name}")
            layout.prop(obj, "location")
            layout.prop(obj, "rotation_euler")
            layout.prop(obj, "scale")
            layout.operator("object.simple_example")
        else:
            layout.label(text="No active object")
```

### 6.2 Panel Placement

| bl_space_type | bl_region_type | Location |
|---------------|----------------|----------|
| `'VIEW_3D'` | `'UI'` | 3D Viewport Sidebar (N-panel) |
| `'VIEW_3D'` | `'TOOLS'` | 3D Viewport Tool Shelf (T-panel) |
| `'PROPERTIES'` | `'WINDOW'` | Properties Editor (requires bl_context) |
| `'NODE_EDITOR'` | `'UI'` | Node Editor Sidebar |
| `'IMAGE_EDITOR'` | `'UI'` | Image Editor Sidebar |
| `'DOPESHEET_EDITOR'` | `'UI'` | Dope Sheet Sidebar |
| `'SEQUENCE_EDITOR'` | `'UI'` | VSE Sidebar |

For Properties panels, set `bl_context` to one of: `"object"`, `"modifier"`, `"particle"`, `"physics"`, `"constraint"`, `"data"`, `"material"`, `"texture"`, `"render"`, `"output"`, `"scene"`, `"world"`.

### 6.3 Layout Methods

```python
def draw(self, context):
    layout = self.layout

    # Row (horizontal)
    row = layout.row()
    row.prop(obj, "location", text="X")
    row.prop(obj, "scale", text="S")

    # Column (vertical)
    col = layout.column()
    col.prop(obj, "name")
    col.prop(obj, "location")

    # Box (bordered group)
    box = layout.box()
    box.label(text="Settings")
    box.prop(obj, "show_name")

    # Split (proportional columns)
    split = layout.split(factor=0.3)
    split.label(text="Label:")
    split.prop(obj, "name", text="")

    # Separator
    layout.separator()

    # Operator button
    layout.operator("object.simple_example", text="Run", icon='PLAY')

    # Enabled/disabled state
    row = layout.row()
    row.enabled = (context.active_object is not None)
    row.operator("object.delete")

    # Alert styling
    row = layout.row()
    row.alert = True
    row.label(text="Warning!", icon='ERROR')
```

### 6.4 Sub-Panels

Create collapsible sub-sections using `bl_parent_id`:

```python
class VIEW3D_PT_my_panel_sub(bpy.types.Panel):
    bl_label = "Advanced Settings"
    bl_idname = "VIEW3D_PT_my_panel_sub"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = "My Tools"
    bl_parent_id = "VIEW3D_PT_my_panel"
    bl_options = {'DEFAULT_CLOSED'}

    def draw(self, context):
        self.layout.label(text="Advanced content here")
```

---

## 7. Writing Menus and Pie Menus

### 7.1 Standard Menus

```python
import bpy

class VIEW3D_MT_my_menu(bpy.types.Menu):
    bl_idname = "VIEW3D_MT_my_menu"
    bl_label = "My Custom Menu"

    def draw(self, context):
        layout = self.layout
        layout.operator("mesh.primitive_cube_add", text="Add Cube", icon='MESH_CUBE')
        layout.operator("mesh.primitive_uv_sphere_add", text="Add Sphere", icon='MESH_UVSPHERE')
        layout.separator()
        layout.operator("object.delete", text="Delete Selected", icon='X')

# Append to an existing menu
def draw_menu_item(self, context):
    self.layout.menu("VIEW3D_MT_my_menu")

bpy.types.VIEW3D_MT_add.append(draw_menu_item)
```

### 7.2 Pie Menus

Pie menus are radial menus activated by a keyboard shortcut [5]:

```python
import bpy

class VIEW3D_MT_PIE_my_pie(bpy.types.Menu):
    bl_idname = "VIEW3D_MT_PIE_my_pie"
    bl_label = "My Pie Menu"

    def draw(self, context):
        layout = self.layout
        pie = layout.menu_pie()

        # Items are placed in compass order:
        # West, East, South, North, NW, NE, SW, SE
        pie.operator("mesh.primitive_cube_add", text="Cube", icon='MESH_CUBE')
        pie.operator("mesh.primitive_uv_sphere_add", text="Sphere", icon='MESH_UVSPHERE')
        pie.operator("mesh.primitive_cylinder_add", text="Cylinder", icon='MESH_CYLINDER')
        pie.operator("mesh.primitive_cone_add", text="Cone", icon='MESH_CONE')
        pie.operator("mesh.primitive_torus_add", text="Torus", icon='MESH_TORUS')
        pie.operator("mesh.primitive_plane_add", text="Plane", icon='MESH_PLANE')
        pie.operator("mesh.primitive_ico_sphere_add", text="Ico Sphere", icon='MESH_ICOSPHERE')
        pie.operator("mesh.primitive_grid_add", text="Grid", icon='MESH_GRID')

# Register with a hotkey
addon_keymaps = []

def register():
    bpy.utils.register_class(VIEW3D_MT_PIE_my_pie)

    wm = bpy.context.window_manager
    kc = wm.keyconfigs.addon
    if kc:
        km = kc.keymaps.new(name='3D View', space_type='VIEW_3D')
        kmi = km.keymap_items.new('wm.call_menu_pie', 'A', 'PRESS', shift=True, ctrl=True)
        kmi.properties.name = "VIEW3D_MT_PIE_my_pie"
        addon_keymaps.append((km, kmi))

def unregister():
    for km, kmi in addon_keymaps:
        km.keymap_items.remove(kmi)
    addon_keymaps.clear()
    bpy.utils.unregister_class(VIEW3D_MT_PIE_my_pie)
```

---

## 8. Add-on Structure

### 8.1 Single-File Add-on

The simplest add-on is a single `.py` file [6]:

```python
bl_info = {
    "name": "My Simple Add-on",
    "author": "Your Name",
    "version": (1, 0, 0),
    "blender": (4, 4, 0),
    "location": "View3D > Sidebar > My Tools",
    "description": "A simple example add-on",
    "warning": "",
    "doc_url": "https://example.com/docs",
    "tracker_url": "https://example.com/issues",
    "category": "Object",
}

import bpy

class OBJECT_OT_my_addon_operator(bpy.types.Operator):
    bl_idname = "object.my_addon_operator"
    bl_label = "My Add-on Operator"
    bl_options = {'REGISTER', 'UNDO'}

    def execute(self, context):
        self.report({'INFO'}, "Add-on operator executed!")
        return {'FINISHED'}

class VIEW3D_PT_my_addon_panel(bpy.types.Panel):
    bl_label = "My Add-on"
    bl_idname = "VIEW3D_PT_my_addon_panel"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = "My Tools"

    def draw(self, context):
        self.layout.operator("object.my_addon_operator")

classes = (
    OBJECT_OT_my_addon_operator,
    VIEW3D_PT_my_addon_panel,
)

def register():
    for cls in classes:
        bpy.utils.register_class(cls)

def unregister():
    for cls in reversed(classes):
        bpy.utils.unregister_class(cls)

if __name__ == "__main__":
    register()
```

### 8.2 bl_info Dictionary

| Key | Type | Description |
|-----|------|-------------|
| `"name"` | str | Display name in Preferences |
| `"author"` | str | Author name(s) |
| `"version"` | tuple | Add-on version (major, minor, patch) |
| `"blender"` | tuple | Minimum Blender version required |
| `"location"` | str | Where to find the add-on in the UI |
| `"description"` | str | Short description (shown in Preferences) |
| `"warning"` | str | Warning text (shown in red) |
| `"doc_url"` | str | Documentation URL |
| `"tracker_url"` | str | Bug tracker URL |
| `"category"` | str | Category in Preferences (Object, Mesh, Animation, Render, etc.) |

### 8.3 Multi-File Add-on Package

For larger add-ons, use a package (directory with `__init__.py`) [6]:

```
my_addon/
    __init__.py         # bl_info, register(), unregister()
    operators.py        # Operator classes
    panels.py           # Panel classes
    properties.py       # PropertyGroup classes
    preferences.py      # AddonPreferences class
    utils.py            # Helper functions
```

**`__init__.py`:**

```python
bl_info = {
    "name": "My Multi-File Add-on",
    "blender": (4, 4, 0),
    "category": "Object",
    "version": (2, 0, 0),
    "author": "Your Name",
    "description": "A multi-file add-on example",
}

import importlib

if "bpy" in locals():
    importlib.reload(operators)
    importlib.reload(panels)
    importlib.reload(properties)
else:
    from . import operators
    from . import panels
    from . import properties

import bpy

def register():
    properties.register()
    operators.register()
    panels.register()

def unregister():
    panels.unregister()
    operators.unregister()
    properties.unregister()
```

The `if "bpy" in locals()` pattern handles script reloading (F3 > Reload Scripts) by using `importlib.reload()` for already-imported modules [6].

### 8.4 Installation

- **User install:** Preferences > Add-ons > Install > select .py file or .zip of package
- **Script path:** Files go to `BLENDER_USER_SCRIPTS/addons/` (or the default user scripts directory)
- **Enable:** Search for the add-on name in Preferences > Add-ons and check the enable box

---

## 9. Add-on Preferences and User Properties

### 9.1 AddonPreferences

Add-on preferences create a settings panel visible in Preferences > Add-ons > (your add-on) [6]:

```python
class MyAddonPreferences(bpy.types.AddonPreferences):
    bl_idname = __name__  # Must match the add-on module name

    output_path: bpy.props.StringProperty(
        name="Output Path",
        description="Default output directory",
        default="//output/",
        subtype='DIR_PATH',
    )

    quality: bpy.props.EnumProperty(
        name="Quality",
        items=[
            ('LOW', "Low", "Fast but low quality"),
            ('MEDIUM', "Medium", "Balanced"),
            ('HIGH', "High", "Slow but high quality"),
        ],
        default='MEDIUM',
    )

    def draw(self, context):
        layout = self.layout
        layout.prop(self, "output_path")
        layout.prop(self, "quality")
```

**Accessing preferences from operator code:**

```python
def execute(self, context):
    prefs = context.preferences.addons[__name__].preferences
    output = prefs.output_path
    quality = prefs.quality
    # ... use settings
```

### 9.2 Scene-Level Custom Properties

For settings that vary per-scene or per-object, use PropertyGroups:

```python
class MySceneProperties(bpy.types.PropertyGroup):
    my_float: bpy.props.FloatProperty(name="My Float", default=1.0)
    my_bool: bpy.props.BoolProperty(name="My Bool", default=False)
    my_string: bpy.props.StringProperty(name="My String", default="hello")

def register():
    bpy.utils.register_class(MySceneProperties)
    bpy.types.Scene.my_props = bpy.props.PointerProperty(type=MySceneProperties)

def unregister():
    del bpy.types.Scene.my_props
    bpy.utils.unregister_class(MySceneProperties)

# Access in operator or panel:
# context.scene.my_props.my_float
```

---

## 10. Complete Script Examples

### 10.1 Batch Renaming Objects by Pattern

```python
"""
Batch Rename Objects by Pattern
Renames all selected objects using a pattern with index numbering.
Run in Blender's Text Editor with objects selected.
"""
import bpy

def batch_rename(prefix="Object", start_index=1, padding=3):
    """Rename all selected objects with a prefix and zero-padded index.

    Args:
        prefix: Name prefix for all objects.
        start_index: Starting index number.
        padding: Zero-padding width for the index.
    """
    selected = bpy.context.selected_objects

    if not selected:
        print("No objects selected.")
        return

    # Sort by name for deterministic ordering
    selected.sort(key=lambda obj: obj.name)

    for i, obj in enumerate(selected, start=start_index):
        old_name = obj.name
        new_name = f"{prefix}_{str(i).zfill(padding)}"
        obj.name = new_name
        print(f"Renamed: {old_name} -> {new_name}")

    print(f"\nRenamed {len(selected)} objects with prefix '{prefix}'.")


# Run the script
batch_rename(prefix="Chair", start_index=1, padding=3)
# Result: Chair_001, Chair_002, Chair_003, ...
```

### 10.2 Mass Export Selected Objects to FBX/glTF

```python
"""
Mass Export Selected Objects to Individual FBX or glTF Files
Each selected object is exported as a separate file.
Run in Blender's Text Editor.
"""
import bpy
import os

def mass_export(
    output_dir="/tmp/exports",
    file_format="FBX",  # "FBX" or "GLTF"
    apply_modifiers=True,
):
    """Export each selected object as an individual file.

    Args:
        output_dir: Directory to save exported files.
        file_format: Export format - "FBX" or "GLTF".
        apply_modifiers: Whether to apply modifiers before export.
    """
    os.makedirs(output_dir, exist_ok=True)

    selected = bpy.context.selected_objects
    if not selected:
        print("No objects selected.")
        return

    # Store original selection
    original_active = bpy.context.active_object

    for obj in selected:
        # Deselect all, select only this object
        bpy.ops.object.select_all(action='DESELECT')
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj

        # Build file path
        safe_name = bpy.path.clean_name(obj.name)

        if file_format == "FBX":
            filepath = os.path.join(output_dir, f"{safe_name}.fbx")
            bpy.ops.export_scene.fbx(
                filepath=filepath,
                use_selection=True,
                apply_scale_options='FBX_SCALE_ALL',
                use_mesh_modifiers=apply_modifiers,
                mesh_smooth_type='FACE',
                add_leaf_bones=False,
            )
        elif file_format == "GLTF":
            filepath = os.path.join(output_dir, f"{safe_name}.glb")
            bpy.ops.export_scene.gltf(
                filepath=filepath,
                use_selection=True,
                export_apply=apply_modifiers,
                export_format='GLB',
            )

        print(f"Exported: {obj.name} -> {filepath}")

    # Restore original selection
    bpy.ops.object.select_all(action='DESELECT')
    for obj in selected:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = original_active

    print(f"\nExported {len(selected)} objects to {output_dir}")


# Run the script
mass_export(output_dir="/tmp/my_exports", file_format="GLTF")
```

### 10.3 Procedural Scene Generation from CSV Data

```python
"""
Procedural 3D Bar Chart from CSV Data
Reads a CSV file and generates a 3D bar chart in the scene.
Run in Blender's Text Editor.
"""
import bpy
import csv
import os

def create_bar_chart(
    csv_path="/tmp/data.csv",
    bar_width=0.8,
    bar_gap=0.3,
    height_scale=1.0,
    color=(0.2, 0.5, 1.0, 1.0),
):
    """Generate a 3D bar chart from CSV data.

    Expected CSV format:
        Label,Value
        January,150
        February,230
        ...

    Args:
        csv_path: Path to the CSV file.
        bar_width: Width of each bar.
        bar_gap: Gap between bars.
        height_scale: Multiplier for bar heights.
        color: RGBA color tuple for the bars.
    """
    # Read CSV data
    data = []
    if os.path.exists(csv_path):
        with open(csv_path, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                label = row.get('Label', row.get('label', ''))
                value = float(row.get('Value', row.get('value', 0)))
                data.append((label, value))
    else:
        # Demo data if no CSV file exists
        data = [
            ("Q1", 120), ("Q2", 180), ("Q3", 95),
            ("Q4", 210), ("Q5", 160), ("Q6", 240),
        ]
        print(f"CSV not found at {csv_path}. Using demo data.")

    if not data:
        print("No data to chart.")
        return

    # Create a collection for the chart
    chart_collection = bpy.data.collections.new("Bar Chart")
    bpy.context.scene.collection.children.link(chart_collection)

    # Create bar material
    mat = bpy.data.materials.new(name="BarMaterial")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = 0.4

    # Create bars
    step = bar_width + bar_gap
    max_value = max(v for _, v in data)

    for i, (label, value) in enumerate(data):
        height = value * height_scale

        # Create bar (cube scaled to size)
        bpy.ops.mesh.primitive_cube_add(
            size=1.0,
            location=(i * step, 0, height / 2),
        )
        bar = bpy.context.active_object
        bar.name = f"Bar_{label}"
        bar.scale = (bar_width, bar_width, height)

        # Assign material
        bar.data.materials.append(mat)

        # Move to chart collection
        for coll in bar.users_collection:
            coll.objects.unlink(bar)
        chart_collection.objects.link(bar)

        # Add text label
        bpy.ops.object.text_add(location=(i * step, -1.0, 0))
        text_obj = bpy.context.active_object
        text_obj.data.body = label
        text_obj.data.size = 0.3
        text_obj.data.align_x = 'CENTER'
        text_obj.rotation_euler.x = 1.5708  # 90 degrees
        text_obj.name = f"Label_{label}"

        for coll in text_obj.users_collection:
            coll.objects.unlink(text_obj)
        chart_collection.objects.link(text_obj)

    # Add ground plane
    total_width = len(data) * step
    bpy.ops.mesh.primitive_plane_add(
        size=total_width * 1.5,
        location=(total_width / 2 - step / 2, 0, -0.01),
    )
    ground = bpy.context.active_object
    ground.name = "Chart_Ground"
    for coll in ground.users_collection:
        coll.objects.unlink(ground)
    chart_collection.objects.link(ground)

    print(f"Created bar chart with {len(data)} bars.")


# Run the script
create_bar_chart()
```

### 10.4 Automated Render Queue with Camera Switching

```python
"""
Automated Render Queue with Camera Switching
Renders the scene from each camera in the scene, saving output per-camera.
Run in Blender's Text Editor.
"""
import bpy
import os

def render_queue(
    output_dir="/tmp/renders",
    resolution_x=1920,
    resolution_y=1080,
    samples=128,
    file_format='PNG',
):
    """Render the scene from every camera and save individually.

    Args:
        output_dir: Directory to save rendered images.
        resolution_x: Render width in pixels.
        resolution_y: Render height in pixels.
        samples: Cycles sample count (ignored for Eevee).
        file_format: Output format (PNG, JPEG, OPEN_EXR, etc.).
    """
    os.makedirs(output_dir, exist_ok=True)

    scene = bpy.context.scene

    # Configure render settings
    scene.render.resolution_x = resolution_x
    scene.render.resolution_y = resolution_y
    scene.render.image_settings.file_format = file_format

    if scene.render.engine == 'CYCLES':
        scene.cycles.samples = samples

    # Find all cameras
    cameras = [obj for obj in bpy.data.objects if obj.type == 'CAMERA']

    if not cameras:
        print("No cameras found in the scene.")
        return

    # Store original camera
    original_camera = scene.camera

    print(f"Found {len(cameras)} cameras. Starting render queue...")

    for i, cam in enumerate(cameras, 1):
        # Set active camera
        scene.camera = cam

        # Build output path
        safe_name = bpy.path.clean_name(cam.name)
        ext = {'PNG': '.png', 'JPEG': '.jpg', 'OPEN_EXR': '.exr'}.get(
            file_format, '.png'
        )
        scene.render.filepath = os.path.join(output_dir, f"{safe_name}{ext}")

        print(f"[{i}/{len(cameras)}] Rendering from camera: {cam.name}")

        # Render
        bpy.ops.render.render(write_still=True)

        print(f"  Saved: {scene.render.filepath}")

    # Restore original camera
    scene.camera = original_camera

    print(f"\nRender queue complete. {len(cameras)} images saved to {output_dir}")


# Run the script
render_queue(output_dir="/tmp/camera_renders", samples=64)
```

### 10.5 Custom Operator: One-Click Character Turntable Render

```python
"""
One-Click Character Turntable Render Operator
Creates a camera orbit around the selected object and renders
a full 360-degree turntable animation.
Install as a Blender add-on or run from the Text Editor.
"""
import bpy
import math

bl_info = {
    "name": "Turntable Render",
    "author": "BLN Research",
    "version": (1, 0, 0),
    "blender": (4, 4, 0),
    "location": "View3D > Sidebar > Turntable",
    "description": "One-click turntable render of selected object",
    "category": "Render",
}


class RENDER_OT_turntable(bpy.types.Operator):
    """Create a turntable camera orbit and render animation"""

    bl_idname = "render.turntable"
    bl_label = "Turntable Render"
    bl_options = {'REGISTER', 'UNDO'}

    frames: bpy.props.IntProperty(
        name="Frames",
        description="Number of frames for full rotation",
        default=120,
        min=24,
        max=1000,
    )

    camera_distance: bpy.props.FloatProperty(
        name="Camera Distance",
        description="Distance from object center to camera",
        default=5.0,
        min=0.5,
        max=100.0,
    )

    camera_height: bpy.props.FloatProperty(
        name="Camera Height",
        description="Camera height above object center",
        default=1.0,
        min=-10.0,
        max=20.0,
    )

    output_path: bpy.props.StringProperty(
        name="Output Path",
        description="Directory for rendered frames",
        default="/tmp/turntable/",
        subtype='DIR_PATH',
    )

    @classmethod
    def poll(cls, context):
        return context.active_object is not None

    def execute(self, context):
        obj = context.active_object
        scene = context.scene

        # Create empty at object center for camera parent
        bpy.ops.object.empty_add(
            type='PLAIN_AXES',
            location=obj.location,
        )
        pivot = context.active_object
        pivot.name = "Turntable_Pivot"

        # Create camera
        cam_data = bpy.data.cameras.new("Turntable_Camera")
        cam_obj = bpy.data.objects.new("Turntable_Camera", cam_data)
        context.collection.objects.link(cam_obj)

        # Position camera
        cam_obj.location = (
            obj.location.x + self.camera_distance,
            obj.location.y,
            obj.location.z + self.camera_height,
        )

        # Parent camera to pivot
        cam_obj.parent = pivot

        # Add Track To constraint so camera always looks at object
        track = cam_obj.constraints.new('TRACK_TO')
        track.target = obj
        track.track_axis = 'TRACK_NEGATIVE_Z'
        track.up_axis = 'UP_Y'

        # Set as scene camera
        scene.camera = cam_obj

        # Animate rotation
        scene.frame_start = 1
        scene.frame_end = self.frames

        # Keyframe rotation at start
        pivot.rotation_euler = (0, 0, 0)
        pivot.keyframe_insert(data_path="rotation_euler", frame=1)

        # Keyframe rotation at end (full 360)
        pivot.rotation_euler = (0, 0, math.radians(360))
        pivot.keyframe_insert(data_path="rotation_euler", frame=self.frames + 1)

        # Set linear interpolation for constant speed
        if pivot.animation_data and pivot.animation_data.action:
            for fcurve in pivot.animation_data.action.fcurves:
                for kf in fcurve.keyframe_points:
                    kf.interpolation = 'LINEAR'

        # Configure output
        scene.render.filepath = self.output_path
        scene.render.image_settings.file_format = 'PNG'

        # Render animation
        self.report({'INFO'}, f"Rendering {self.frames} frames...")
        bpy.ops.render.render(animation=True)

        self.report({'INFO'}, f"Turntable render complete: {self.output_path}")
        return {'FINISHED'}

    def invoke(self, context, event):
        return context.window_manager.invoke_props_dialog(self)


class VIEW3D_PT_turntable(bpy.types.Panel):
    bl_label = "Turntable Render"
    bl_idname = "VIEW3D_PT_turntable"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = "Turntable"

    def draw(self, context):
        layout = self.layout
        layout.operator("render.turntable", icon='RENDER_ANIMATION')


classes = (RENDER_OT_turntable, VIEW3D_PT_turntable)

def register():
    for cls in classes:
        bpy.utils.register_class(cls)

def unregister():
    for cls in reversed(classes):
        bpy.utils.unregister_class(cls)

if __name__ == "__main__":
    register()
```

### 10.6 Asset Library Management Script

```python
"""
Asset Library Management Script
Scans a directory of .blend files, catalogs their contents,
and provides batch operations for asset management.
Run in Blender's Text Editor.
"""
import bpy
import os
import json

def catalog_asset_library(
    library_path="/home/user/blender_assets",
    output_json="/tmp/asset_catalog.json",
):
    """Scan a directory of .blend files and catalog all data blocks.

    Args:
        library_path: Root directory containing .blend files.
        output_json: Path to save the catalog JSON.
    """
    catalog = {
        "library_path": library_path,
        "files": [],
        "summary": {
            "total_files": 0,
            "total_objects": 0,
            "total_materials": 0,
            "total_collections": 0,
        },
    }

    if not os.path.exists(library_path):
        print(f"Library path does not exist: {library_path}")
        return

    # Find all .blend files
    blend_files = []
    for root, dirs, files in os.walk(library_path):
        for f in files:
            if f.endswith('.blend'):
                blend_files.append(os.path.join(root, f))

    print(f"Found {len(blend_files)} .blend files in {library_path}")

    for filepath in sorted(blend_files):
        rel_path = os.path.relpath(filepath, library_path)
        file_entry = {
            "path": rel_path,
            "objects": [],
            "materials": [],
            "collections": [],
        }

        # Use Blender's library reading to inspect the file
        with bpy.data.libraries.load(filepath, link=False) as (data_from, data_to):
            file_entry["objects"] = list(data_from.objects)
            file_entry["materials"] = list(data_from.materials)
            file_entry["collections"] = list(data_from.collections)

        catalog["files"].append(file_entry)
        catalog["summary"]["total_objects"] += len(file_entry["objects"])
        catalog["summary"]["total_materials"] += len(file_entry["materials"])
        catalog["summary"]["total_collections"] += len(file_entry["collections"])

        print(f"  {rel_path}: {len(file_entry['objects'])} objects, "
              f"{len(file_entry['materials'])} materials")

    catalog["summary"]["total_files"] = len(blend_files)

    # Save catalog
    with open(output_json, 'w') as f:
        json.dump(catalog, f, indent=2)

    print(f"\nCatalog saved to {output_json}")
    print(f"Summary: {catalog['summary']}")

    return catalog


def batch_append_from_library(
    source_blend="/home/user/blender_assets/characters/hero.blend",
    data_type="objects",
    names=None,
):
    """Append specific data blocks from a .blend file into the current scene.

    Args:
        source_blend: Path to the source .blend file.
        data_type: Type of data to append ("objects", "materials", "collections").
        names: List of names to append. None = append all of that type.
    """
    with bpy.data.libraries.load(source_blend, link=False) as (data_from, data_to):
        available = getattr(data_from, data_type)

        if names is None:
            names = list(available)

        setattr(data_to, data_type, [n for n in names if n in available])

    # Link appended objects to scene
    if data_type == "objects":
        for obj in getattr(data_to, data_type):
            if obj is not None:
                bpy.context.collection.objects.link(obj)
                print(f"Appended object: {obj.name}")

    elif data_type == "collections":
        for coll in getattr(data_to, data_type):
            if coll is not None:
                bpy.context.scene.collection.children.link(coll)
                print(f"Appended collection: {coll.name}")

    print(f"Batch append complete from {source_blend}")


# Example usage:
# catalog_asset_library("/home/user/blender_assets")
# batch_append_from_library("/path/to/file.blend", "objects", ["Hero_Character"])
```

---

## 11. Pipeline Integration

### 11.1 USD (Universal Scene Description)

**USD** is Pixar's open-source scene description format designed for large-scale production pipelines. Blender supports USD import and export [7]:

**Export:**
```python
bpy.ops.wm.usd_export(
    filepath="/path/to/scene.usdc",
    selected_objects_only=False,
    export_animation=True,
    export_hair=True,
    export_uvmaps=True,
    export_normals=True,
    export_materials=True,
    generate_preview_surface=True,  # MaterialX preview
)
```

**Import:**
```python
bpy.ops.wm.usd_import(
    filepath="/path/to/scene.usdc",
    import_cameras=True,
    import_curves=True,
    import_lights=True,
    import_materials=True,
    import_meshes=True,
    import_volumes=True,
    read_mesh_uvs=True,
    read_mesh_colors=True,
)
```

**USD format variants:**
| Extension | Format | Use Case |
|-----------|--------|----------|
| `.usda` | ASCII (human-readable) | Debugging, hand-editing |
| `.usdc` | Binary (Crate) | Production (fast, compact) |
| `.usdz` | Zipped package (usdc + textures) | AR/web delivery (Apple AR, Android) |

### 11.2 FBX Workflows

FBX (Filmbox) is the most common interchange format for game engines and DCC tools [7]:

```python
# Export with game-engine-ready settings
bpy.ops.export_scene.fbx(
    filepath="/path/to/model.fbx",
    use_selection=True,
    apply_scale_options='FBX_SCALE_ALL',
    use_mesh_modifiers=True,
    mesh_smooth_type='FACE',
    use_mesh_edges=False,
    add_leaf_bones=False,       # Prevent extra bones for game engines
    primary_bone_axis='Y',      # Match Unity/Unreal conventions
    secondary_bone_axis='X',
    bake_anim=True,
    bake_anim_use_all_bones=True,
    bake_anim_use_nla_strips=False,
    bake_anim_use_all_actions=True,
    bake_anim_simplify_factor=1.0,
)
```

**Common FBX gotchas:**
- Scale issues: Blender uses meters, some engines use centimeters. Use `apply_scale_options='FBX_SCALE_ALL'`
- Bone orientation: Blender bones point along Y; Unity/Unreal expect different conventions
- Leaf bones: Disable `add_leaf_bones` for game engine export (they add unwanted extra bones)

### 11.3 glTF for Web and Real-Time

**glTF 2.0** (GL Transmission Format) is the "JPEG of 3D" -- optimized for web and real-time applications [7]:

```python
# Export as binary glTF (.glb) - single file with embedded textures
bpy.ops.export_scene.gltf(
    filepath="/path/to/model.glb",
    export_format='GLB',          # GLB (binary), GLTF_SEPARATE, GLTF_EMBEDDED
    use_selection=True,
    export_apply=True,            # Apply modifiers
    export_animations=True,
    export_skins=True,            # Armature skinning
    export_morph=True,            # Shape keys
    export_lights=True,
    export_cameras=True,
    export_extras=True,           # Custom properties
    export_draco_mesh_compression_enable=True,  # Draco compression
)
```

**glTF vs. FBX for different targets:**

| Target | Recommended Format | Reason |
|--------|-------------------|--------|
| Web (Three.js, Babylon.js) | glTF/GLB | Native web support, smallest file size |
| Unity | FBX or glTF | Both supported; FBX more established |
| Unreal Engine | FBX | Primary import format |
| AR (Apple/Android) | USDZ / glTF | Platform-specific |
| Interchange with other DCC | USD or FBX | Widest compatibility |

---

## 12. Production Management Integration

### 12.1 Kitsu (CG-Wire)

**Kitsu** is an open-source production management tool for animation studios. Blender integrates with Kitsu via the **Blender Kitsu** add-on [8]:

- Track shots, tasks, and revisions
- Publish renders and playblasts directly from Blender
- Receive task assignments and download the latest approved assets
- Comment on shots and receive feedback within Blender

The Kitsu add-on communicates with the Kitsu server via its REST API (`https://your-kitsu-server/api/`), providing access to shots, tasks, versions, and file locations.

### 12.2 ShotGrid (formerly Shotgun)

**ShotGrid** (Autodesk) is a widely-used production tracking platform. Integration with Blender is typically achieved through:

- **ShotGrid Toolkit (sgtk)** -- Autodesk's pipeline framework
- Custom Python scripts using the ShotGrid Python API (`shotgun_api3`)
- Event-driven workflows that publish Blender renders to ShotGrid

```python
# Example: Publish render to ShotGrid (conceptual)
import shotgun_api3

sg = shotgun_api3.Shotgun(
    "https://your-studio.shotgrid.autodesk.com",
    script_name="blender_publish",
    api_key="your-api-key",
)

# Create a Version (published render)
version = sg.create("Version", {
    "project": {"type": "Project", "id": 123},
    "entity": {"type": "Shot", "id": 456},
    "code": "shot_010_comp_v003",
    "sg_path_to_movie": "/renders/shot_010_comp_v003.mp4",
})
```

### 12.3 Linking and Appending from Asset Libraries

**Linking** loads data from another .blend file as a reference (changes in the source propagate):

```python
# Link a collection from another file
bpy.ops.wm.link(
    filepath="/path/to/assets.blend/Collection/Props",
    directory="/path/to/assets.blend/Collection/",
    filename="Props",
)
```

**Appending** copies data from another file into the current file (independent copy):

```python
# Append a material from another file
bpy.ops.wm.append(
    filepath="/path/to/materials.blend/Material/MetalRough",
    directory="/path/to/materials.blend/Material/",
    filename="MetalRough",
)
```

### 12.4 Blender Asset Browser

Blender 3.0+ includes a built-in **Asset Browser** for managing reusable assets:

- **Mark as Asset:** Right-click any data block > Mark as Asset
- **Catalog:** Organize assets into hierarchical catalogs
- **Library paths:** Configure in Preferences > File Paths > Asset Libraries
- **Drag and drop:** Assets can be dragged from the Asset Browser into the scene
- **Metadata:** Each asset stores author, description, tags, and preview images [7]

---

## 13. Asset Libraries and Linking

### 13.1 Library Overrides

When assets are **linked** from external files, they cannot be edited directly. **Library Overrides** (replacing the legacy Proxy system) allow specific properties to be overridden locally while keeping the link intact:

1. Link a collection containing a character rig
2. Select the linked armature
3. **Object > Library Override > Make**
4. The armature can now be posed and animated locally
5. Changes to the original asset file still propagate (except for overridden properties)

### 13.2 Asset Library Best Practices

| Practice | Reason |
|----------|--------|
| One asset per .blend file | Clean organization, avoids loading unnecessary data |
| Use collections as the top-level asset | Groups all related objects together |
| Standardize naming conventions | `CATEGORY_AssetName_v001` for searchability |
| Generate previews | Asset Browser uses previews for visual browsing |
| Use catalogs for taxonomy | Hierarchical organization (Characters > Heroes > Human) |
| Version assets in the filename | Enables rollback without version control complexity |

---

## 14. Flamenco Render Farm

### 14.1 Architecture

**Flamenco** is Blender's open-source render farm orchestration system [9][10]:

```
+------------------+
|  Blender Client   |  (Add-on submits jobs)
+--------+---------+
         |
         v
+--------+---------+
| Flamenco Manager  |  (Central coordinator)
+--------+---------+
         |
    +----+----+
    |    |    |
    v    v    v
+----+ +----+ +----+
| W1 | | W2 | | W3 |  (Workers: render nodes)
+----+ +----+ +----+
         |
         v
+--------+---------+
|  Shared Storage   |  (NAS/NFS/SMB: .blend files + output)
+------------------+
```

### 14.2 Setup

1. **Install Flamenco Manager** on a central machine (can be one of the workers)
2. **Configure shared storage** accessible by all machines (NAS, NFS mount, SMB share)
3. **Install Flamenco Worker** on each render node
4. **Install Flamenco Add-on** in Blender on artist workstations
5. Workers auto-discover the Manager on the LAN (or configure manually)

### 14.3 Job Types

Flamenco includes two built-in job types [10]:

| Job Type | Description |
|----------|-------------|
| **Simple Blender Render** | Renders a range of frames from a .blend file, optionally creates a preview video with FFmpeg |
| **Single Image Render** | Splits a single frame into tiles, renders each on different workers, and merges the result |

Custom job types can be created using JavaScript scripts that run on the Manager.

### 14.4 Worker Configuration

Workers are configured via `flamenco-worker.yaml` [10]:

```yaml
# flamenco-worker.yaml
manager_url: http://flamenco-manager:8080/

# Task types this worker can handle
task_types:
  - blender
  - ffmpeg
  - file-management

# Platform-specific Blender path
blender_path_linux: /opt/blender/blender
blender_path_windows: C:\Blender\blender.exe
blender_path_darwin: /Applications/Blender.app/Contents/MacOS/Blender
```

### 14.5 Submitting Jobs

From Blender (with the Flamenco add-on installed):

1. Open the Flamenco panel in the Properties sidebar
2. Configure the job:
   - Frame range
   - Chunk size (frames per task -- smaller chunks = better parallelism)
   - Priority
   - Output format
3. Click **Submit Job**

The Manager divides the frame range into chunks, assigns chunks to available workers, monitors progress, handles failures and retries, and reassembles the output [9].

---

## 15. Running Blender Headlessly

### 15.1 Command-Line Basics

Blender can run without a GUI using the `-b` / `--background` flag [11]:

```bash
# Render a single frame
blender --background scene.blend --render-frame 1

# Render an animation (all frames)
blender --background scene.blend --render-anim

# Render frames 10-50
blender --background scene.blend --frame-start 10 --frame-end 50 --render-anim

# Run a Python script
blender --background scene.blend --python script.py

# Run a Python expression
blender --background --python-expr "import bpy; print(bpy.app.version)"

# Run without loading a file
blender --background --python script.py
```

### 15.2 Argument Ordering

**Order matters.** Blender processes arguments left-to-right:

```bash
# CORRECT: Load file first, then run script
blender --background scene.blend --python script.py

# WRONG: Script runs before file loads
blender --background --python script.py scene.blend
```

### 15.3 Passing Custom Arguments

Use `--` to separate Blender arguments from script arguments [11]:

```bash
blender --background scene.blend --python render_script.py -- \
    --output /tmp/renders/ \
    --quality high \
    --camera Camera.001
```

In the Python script:

```python
import sys
import argparse

# Get arguments after '--'
argv = sys.argv
if "--" in argv:
    argv = argv[argv.index("--") + 1:]
else:
    argv = []

parser = argparse.ArgumentParser()
parser.add_argument("--output", required=True)
parser.add_argument("--quality", default="medium")
parser.add_argument("--camera", default=None)
args = parser.parse_args(argv)

# Use args in your script
print(f"Output: {args.output}")
```

### 15.4 Common Command-Line Flags

| Flag | Description |
|------|-------------|
| `-b` / `--background` | Run without GUI |
| `-P` / `--python` | Run a Python script |
| `--python-expr` | Run a Python expression |
| `-F` / `--render-format` | Set output format (PNG, JPEG, EXR, etc.) |
| `-o` / `--render-output` | Set output path |
| `-f` / `--render-frame` | Render a specific frame |
| `-a` / `--render-anim` | Render full animation |
| `-s` / `--frame-start` | Set start frame |
| `-e` / `--frame-end` | Set end frame |
| `-E` / `--engine` | Set render engine (CYCLES, BLENDER_EEVEE_NEXT) |
| `-t` / `--threads` | Set thread count |
| `--factory-startup` | Ignore user preferences and startup file |

### 15.5 BLENDER_USER_SCRIPTS Environment Variable

The `BLENDER_USER_SCRIPTS` environment variable overrides the default user scripts directory. This is useful for:

- CI/CD pipelines that need specific add-ons
- Docker containers with standardized tool configurations
- Shared studio setups where scripts live on a network drive

```bash
export BLENDER_USER_SCRIPTS=/studio/pipeline/blender_scripts
blender --background scene.blend --python render.py
```

The directory structure under `BLENDER_USER_SCRIPTS` mirrors the standard layout:

```
$BLENDER_USER_SCRIPTS/
    addons/          # Add-on modules
    modules/         # Python modules importable by scripts
    presets/         # User presets
    startup/         # Scripts that run on startup
    templates_py/    # Script templates
```

### 15.6 Headless Rendering in Docker

```dockerfile
FROM ubuntu:22.04

# Install dependencies
RUN apt-get update && apt-get install -y \
    wget libgl1-mesa-glx libxi6 libxrender1 libxkbcommon0

# Download and install Blender
RUN wget https://download.blender.org/release/Blender4.4/blender-4.4.0-linux-x64.tar.xz \
    && tar xf blender-4.4.0-linux-x64.tar.xz \
    && mv blender-4.4.0-linux-x64 /opt/blender

ENV PATH="/opt/blender:${PATH}"

WORKDIR /renders
ENTRYPOINT ["blender", "--background"]
```

---

## 16. Common Pitfalls and Practical Tips

### 16.1 Python Scripting Pitfalls

| Pitfall | Cause | Solution |
|---------|-------|----------|
| **`RuntimeError: Operator bpy.ops.X context is incorrect`** | Operator called in wrong mode or context | Check the operator's poll conditions; use `bpy.context.temp_override()` for context overrides |
| **Properties not saving** | Custom properties not registered on a Blender type | Use `bpy.props` and register via `PointerProperty` on the appropriate type |
| **Script works in Text Editor but not as add-on** | Missing `bl_info`, `register()`, or `unregister()` | Ensure all three are present; test with `bpy.utils.register_class()` |
| **Import errors in multi-file add-on** | Relative imports failing | Use `from . import module_name` and ensure `__init__.py` exists |
| **`AttributeError` after script reload** | Stale class references after reloading | Use the `importlib.reload()` pattern in `__init__.py` |
| **Undo breaks custom properties** | Properties not serialized in undo history | Use `bpy.props` (not Python attributes) for undoable properties |

### 16.2 Pipeline Pitfalls

| Pitfall | Cause | Solution |
|---------|-------|----------|
| **FBX scale mismatch** | Blender meters vs. engine centimeters | Use `apply_scale_options='FBX_SCALE_ALL'` in export |
| **Missing textures in exported files** | Textures not packed or paths not relative | Pack textures (`File > External Data > Pack Resources`) or use GLB format |
| **Lost animation on FBX export** | NLA strips not baked | Enable `bake_anim` and `bake_anim_use_nla_strips` in FBX export |
| **USD material mismatch** | Blender-specific shader nodes not translatable | Use Principled BSDF for maximum USD compatibility |
| **Linked assets break on file move** | Absolute paths in library links | Use relative paths (`//` prefix); enable `Relative Path` in preferences |

### 16.3 Performance Tips for Scripts

- **Avoid calling operators in loops** -- use direct data manipulation (`bpy.data`) instead of `bpy.ops` when possible
- **Batch mesh operations** -- use `bmesh` module for complex mesh editing; commit changes once
- **Disable viewport updates** during long operations:
  ```python
  # Disable viewport redraw during heavy operations
  bpy.context.view_layer.update()  # Update once at the end
  ```
- **Use `foreach_get` / `foreach_set`** for fast array access on mesh data:
  ```python
  # Fast: read all vertex positions at once
  import numpy as np
  mesh = bpy.data.meshes["MyMesh"]
  verts = np.zeros(len(mesh.vertices) * 3)
  mesh.vertices.foreach_get("co", verts)
  ```
- **Profile with `cProfile`**:
  ```python
  import cProfile
  cProfile.run('my_function()', sort='cumulative')
  ```

### 16.4 Debugging Tips

- **Print to console:** `print()` output goes to the system console (Window > Toggle System Console on Windows)
- **Use `self.report()`** in operators to show messages in the status bar
- **Inspect data interactively:** Use the Python Console editor with autocomplete (**Tab**)
- **Check the Info editor:** Every action is logged as a Python command
- **Use breakpoints:** External IDEs can attach to Blender's Python with `debugpy`:
  ```python
  import debugpy
  debugpy.listen(5678)
  debugpy.wait_for_client()
  ```

---

## 17. Sources

1. Blender Foundation. "Python API Quickstart." *Blender Python API*. https://docs.blender.org/api/current/info_quickstart.html
2. Blender Foundation. "API Overview." *Blender Python API*. https://docs.blender.org/api/current/info_overview.html
3. Blender Foundation. "Math Types & Utilities (mathutils)." *Blender Python API*. https://docs.blender.org/api/current/mathutils.html
4. Blender Foundation. "Operator (bpy_struct)." *Blender Python API*. https://docs.blender.org/api/current/bpy.types.Operator.html
5. Blender Foundation. "Menu (bpy_struct)." *Blender Python API*. https://docs.blender.org/api/current/bpy.types.Menu.html
6. Blender Foundation. "Add-on Tutorial." *Blender Manual*. https://docs.blender.org/manual/en/latest/advanced/scripting/addon_tutorial.html
7. Blender Foundation. "Pipeline." *Blender.org*. https://www.blender.org/features/pipeline/
8. CG-Wire. "Kitsu -- Open Source Production Tracker." https://www.cg-wire.com/kitsu
9. Blender Foundation. "Flamenco." https://flamenco.blender.org/
10. Blender Foundation. "Flamenco -- Built-in Job Types." https://flamenco.blender.org/usage/job-types/builtin/
11. Blender Foundation. "Tips and Tricks -- Command Line." *Blender Python API*. https://docs.blender.org/api/current/info_tips_and_tricks.html
12. Blender Foundation. "Export Scene Operators." *Blender Python API*. https://docs.blender.org/api/current/bpy.ops.export_scene.html
13. Blender Foundation. "Import Scene Operators." *Blender Python API*. https://docs.blender.org/api/current/bpy.ops.import_scene.html
14. Blender Foundation. "Blender 4.4: Python API." *Blender Developer Documentation*. https://developer.blender.org/docs/release_notes/4.4/python_api/
15. Khronos Group. "Blender glTF 2.0 Importer and Exporter." *GitHub*. https://github.com/KhronosGroup/glTF-Blender-IO
16. Blender Foundation. "AddonPreferences (bpy_struct)." *Blender Python API*. https://docs.blender.org/api/current/bpy.types.AddonPreferences.html

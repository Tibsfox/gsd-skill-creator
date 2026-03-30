/*
 * shader-viewer.c — Standalone GLSL fragment shader viewer
 * NASA Mission Series — renders mission shaders as screensavers/wallpapers
 *
 * Build:
 *   gcc -o shader-viewer shader-viewer.c \
 *       $(pkg-config --cflags --libs glfw3 gl) -lm
 *
 * Usage:
 *   ./shader-viewer path/to/shader.frag              # Windowed
 *   ./shader-viewer path/to/shader.frag --fullscreen  # Fullscreen
 *   ./shader-viewer path/to/shader.frag --record 80   # Record 80 seconds to video
 *
 * The shader must be GLSL ES 3.00 (#version 300 es) with:
 *   uniform float u_time;
 *   uniform vec2 u_resolution;
 *   out vec4 fragColor;
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <epoxy/gl.h>
#include <GLFW/glfw3.h>

/* Read entire file into malloc'd buffer */
static char *read_file(const char *path) {
    FILE *f = fopen(path, "rb");
    if (!f) { fprintf(stderr, "Cannot open %s\n", path); return NULL; }
    fseek(f, 0, SEEK_END);
    long len = ftell(f);
    fseek(f, 0, SEEK_SET);
    char *buf = (char *)malloc(len + 1);
    fread(buf, 1, len, f);
    buf[len] = '\0';
    fclose(f);
    return buf;
}

/* Compile shader, print errors */
static GLuint compile_shader(GLenum type, const char *source) {
    GLuint s = glCreateShader(type);
    glShaderSource(s, 1, &source, NULL);
    glCompileShader(s);
    GLint ok;
    glGetShaderiv(s, GL_COMPILE_STATUS, &ok);
    if (!ok) {
        char log[2048];
        glGetShaderInfoLog(s, sizeof(log), NULL, log);
        fprintf(stderr, "Shader compile error:\n%s\n", log);
        glDeleteShader(s);
        return 0;
    }
    return s;
}

/* Vertex shader: fullscreen triangle */
static const char *vert_src =
    "#version 330 core\n"
    "out vec2 vUV;\n"
    "void main() {\n"
    "  float x = float((gl_VertexID & 1) << 2) - 1.0;\n"
    "  float y = float((gl_VertexID & 2) << 1) - 1.0;\n"
    "  vUV = vec2(x, y) * 0.5 + 0.5;\n"
    "  gl_Position = vec4(x, y, 0.0, 1.0);\n"
    "}\n";

/* Adapt GLES 300 shader to desktop GL 330 */
static char *adapt_shader(const char *source) {
    /* Replace #version 300 es with #version 330 core */
    const char *ver = strstr(source, "#version 300 es");
    if (!ver) {
        /* Already desktop GL or no version — use as-is */
        char *copy = strdup(source);
        return copy;
    }

    size_t prefix_len = ver - source;
    const char *rest = ver + strlen("#version 300 es");
    const char *new_ver = "#version 330 core";
    size_t new_len = prefix_len + strlen(new_ver) + strlen(rest) + 1;

    char *adapted = (char *)malloc(new_len);
    memcpy(adapted, source, prefix_len);
    memcpy(adapted + prefix_len, new_ver, strlen(new_ver));
    strcpy(adapted + prefix_len + strlen(new_ver), rest);

    /* Replace precision qualifiers (not needed in desktop GL) */
    char *p;
    while ((p = strstr(adapted, "precision highp float;")) != NULL) {
        memset(p, ' ', strlen("precision highp float;"));
    }
    while ((p = strstr(adapted, "precision mediump float;")) != NULL) {
        memset(p, ' ', strlen("precision mediump float;"));
    }

    return adapted;
}

static void key_callback(GLFWwindow *win, int key, int sc, int act, int mod) {
    if (act == GLFW_PRESS && (key == GLFW_KEY_ESCAPE || key == GLFW_KEY_Q))
        glfwSetWindowShouldClose(win, GLFW_TRUE);
}

int main(int argc, char **argv) {
    if (argc < 2) {
        fprintf(stderr, "Usage: %s <shader.frag> [--fullscreen] [--record <seconds>]\n", argv[0]);
        return 1;
    }

    const char *shader_path = argv[1];
    int fullscreen = 0;
    int record = 0;
    float record_seconds = 0;

    for (int i = 2; i < argc; i++) {
        if (strcmp(argv[i], "--fullscreen") == 0 || strcmp(argv[i], "-f") == 0)
            fullscreen = 1;
        if (strcmp(argv[i], "--record") == 0 && i + 1 < argc) {
            record = 1;
            record_seconds = atof(argv[++i]);
        }
    }

    /* Read fragment shader */
    char *frag_raw = read_file(shader_path);
    if (!frag_raw) return 1;

    /* Adapt to desktop GL */
    char *frag_src = adapt_shader(frag_raw);
    free(frag_raw);

    /* Init GLFW */
    if (!glfwInit()) {
        fprintf(stderr, "Failed to init GLFW\n");
        free(frag_src);
        return 1;
    }

    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);

    int width = 1280, height = 720;
    GLFWmonitor *monitor = NULL;

    if (fullscreen) {
        monitor = glfwGetPrimaryMonitor();
        const GLFWvidmode *mode = glfwGetVideoMode(monitor);
        width = mode->width;
        height = mode->height;
    }

    GLFWwindow *win = glfwCreateWindow(width, height,
        "Pioneer 0 — Shader Viewer", monitor, NULL);
    if (!win) {
        fprintf(stderr, "Failed to create window\n");
        glfwTerminate();
        free(frag_src);
        return 1;
    }

    glfwMakeContextCurrent(win);
    /* libepoxy handles GL function loading automatically */

    glfwSetKeyCallback(win, key_callback);
    glfwSwapInterval(1); /* vsync */

    if (fullscreen)
        glfwSetInputMode(win, GLFW_CURSOR, GLFW_CURSOR_HIDDEN);

    /* Compile shaders */
    GLuint vs = compile_shader(GL_VERTEX_SHADER, vert_src);
    GLuint fs = compile_shader(GL_FRAGMENT_SHADER, frag_src);
    free(frag_src);

    if (!vs || !fs) {
        glfwTerminate();
        return 1;
    }

    GLuint prog = glCreateProgram();
    glAttachShader(prog, vs);
    glAttachShader(prog, fs);
    glLinkProgram(prog);

    GLint linked;
    glGetProgramiv(prog, GL_LINK_STATUS, &linked);
    if (!linked) {
        char log[2048];
        glGetProgramInfoLog(prog, sizeof(log), NULL, log);
        fprintf(stderr, "Link error:\n%s\n", log);
        glfwTerminate();
        return 1;
    }

    glDeleteShader(vs);
    glDeleteShader(fs);

    /* Get uniform locations */
    GLint u_time = glGetUniformLocation(prog, "u_time");
    GLint u_resolution = glGetUniformLocation(prog, "u_resolution");

    /* Create empty VAO (needed for core profile) */
    GLuint vao;
    glGenVertexArrays(1, &vao);
    glBindVertexArray(vao);

    /* For recording: open ffmpeg pipe */
    FILE *ffmpeg_pipe = NULL;
    unsigned char *pixels = NULL;
    if (record) {
        char cmd[1024];
        snprintf(cmd, sizeof(cmd),
            "ffmpeg -y -f rawvideo -pix_fmt rgb24 -s %dx%d -r 30 "
            "-i - -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p "
            "pioneer0-wallpaper.mp4 2>/dev/null",
            width, height);
        ffmpeg_pipe = popen(cmd, "w");
        pixels = (unsigned char *)malloc(width * height * 3);
        printf("Recording %g seconds to pioneer0-wallpaper.mp4...\n", record_seconds);
    }

    /* Render loop */
    double start = glfwGetTime();
    int frame = 0;

    while (!glfwWindowShouldClose(win)) {
        double t = glfwGetTime() - start;

        if (record && t > record_seconds) break;

        glfwGetFramebufferSize(win, &width, &height);
        glViewport(0, 0, width, height);

        glUseProgram(prog);
        if (u_time >= 0) glUniform1f(u_time, (float)t);
        if (u_resolution >= 0) glUniform2f(u_resolution, (float)width, (float)height);

        glDrawArrays(GL_TRIANGLES, 0, 3);

        if (record && ffmpeg_pipe && pixels) {
            glReadPixels(0, 0, width, height, GL_RGB, GL_UNSIGNED_BYTE, pixels);
            /* Flip vertically (OpenGL is bottom-up) */
            int row_size = width * 3;
            unsigned char *tmp = (unsigned char *)malloc(row_size);
            for (int y = 0; y < height / 2; y++) {
                memcpy(tmp, pixels + y * row_size, row_size);
                memcpy(pixels + y * row_size, pixels + (height - 1 - y) * row_size, row_size);
                memcpy(pixels + (height - 1 - y) * row_size, tmp, row_size);
            }
            free(tmp);
            fwrite(pixels, 1, width * height * 3, ffmpeg_pipe);
            frame++;
            if (frame % 30 == 0)
                printf("\r  %.0f / %.0f seconds", t, record_seconds);
        }

        glfwSwapBuffers(win);
        glfwPollEvents();
    }

    if (ffmpeg_pipe) {
        pclose(ffmpeg_pipe);
        free(pixels);
        printf("\nDone! Saved pioneer0-wallpaper.mp4 (%d frames)\n", frame);
    }

    glDeleteProgram(prog);
    glDeleteVertexArrays(1, &vao);
    glfwTerminate();
    return 0;
}

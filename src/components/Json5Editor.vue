<script lang="ts">
import { defineComponent, onMounted, ref, watch } from 'vue'
import JSONEditor from 'jsoneditor'
import JSON5 from 'json5';
import 'jsoneditor/dist/jsoneditor.css'
import 'brace';
import 'brace/mode/json';
import 'brace/theme/monokai';

export default defineComponent({
    name: 'Json5Editor',
    props: {
        value: {
            type: Object,
            required: true
        }
    },
    emits: ['update:modelValue', 'error:modelValue'],
    setup(props, { emit }) {
        const jsoneditorRef = ref<HTMLElement | null>(null);
        let jsoneditor: JSONEditor;

        onMounted(() => {
            jsoneditor = new JSONEditor(jsoneditorRef.value!, {
                modes: ['code', 'form', 'text', 'tree', 'view'], // allowed modes
                mode: 'code', // set default mode
                onChangeText: (newValue) => {
                    try {
                        emit('update:modelValue', JSON5.parse(newValue));
                    } catch (error) {
                        emit('error:modelValue', error);
                    }
                },
            })
            // Set the theme of the Ace editor instance
            if (jsoneditor.aceEditor) {
                jsoneditor.aceEditor.setTheme('ace/theme/monokai');
            }

            jsoneditor.set(props.value);
        });

        watch(() => props.value, (newValue, oldValue) => {
            jsoneditor.set(newValue);
        });

        return {
            jsoneditorRef
        };
    }
});
</script>

<template>
    <div ref="jsoneditorRef" style="height: 80vh;"></div>
</template>

<style>
/* dark styling of the editor */
div.jsoneditor,
div.jsoneditor-menu,
div.jsoneditor-statusbar {
    border-color: #4b4b4b;
}

div.jsoneditor-menu,
div.jsoneditor-statusbar {
    background-color: #4b4b4b;
}

div.jsoneditor-tree,
div.jsoneditor textarea.jsoneditor-text {
    background-color: #666666;
    color: #ffffff;
}

div.jsoneditor-field,
div.jsoneditor-value {
    color: #ffffff;
}

table.jsoneditor-search div.jsoneditor-frame {
    background: #808080;
}

tr.jsoneditor-highlight,
tr.jsoneditor-selected {
    background-color: #808080;
}

div.jsoneditor-field[contenteditable=true]:focus,
div.jsoneditor-field[contenteditable=true]:hover,
div.jsoneditor-value[contenteditable=true]:focus,
div.jsoneditor-value[contenteditable=true]:hover,
div.jsoneditor-field.jsoneditor-highlight,
div.jsoneditor-value.jsoneditor-highlight {
    background-color: #808080;
    border-color: #808080;
}

div.jsoneditor-field.highlight-active,
div.jsoneditor-field.highlight-active:focus,
div.jsoneditor-field.highlight-active:hover,
div.jsoneditor-value.highlight-active,
div.jsoneditor-value.highlight-active:focus,
div.jsoneditor-value.highlight-active:hover {
    background-color: #b1b1b1;
    border-color: #b1b1b1;
}

div.jsoneditor-tree button:focus {
    background-color: #868686;
}

/* coloring of JSON in tree mode */
div.jsoneditor-readonly {
    color: #acacac;
}

div.jsoneditor td.jsoneditor-separator {
    color: #acacac;
}

div.jsoneditor-value.jsoneditor-string {
    color: #00ff88;
}

div.jsoneditor-value.jsoneditor-object,
div.jsoneditor-value.jsoneditor-array {
    color: #bababa;
}

div.jsoneditor-value.jsoneditor-number {
    color: #ff4040;
}

div.jsoneditor-value.jsoneditor-boolean {
    color: #ff8048;
}

div.jsoneditor-value.jsoneditor-null {
    color: #49a7fc;
}

div.jsoneditor-value.jsoneditor-invalid {
    color: white;
}
</style>
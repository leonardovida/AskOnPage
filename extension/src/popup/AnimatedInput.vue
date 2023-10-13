<template>
    <div class="input-container">
        <input v-model="inputText" type="text" class="ask-bar" ref="askBar" placeholder="Find or Ask...">
    </div>
</template>

<script>

export default {
    name: 'AnimatedInput',
    data() {
        return {
            inputText: "",
            debounceTimeout: null
        };
    },

    methods: {
        debounce(func, args, wait) {
            clearTimeout(this.debounceTimeout);
            this.debounceTimeout = setTimeout(() => {
                func.apply(this, args);
            }, wait);
        },
        async spawnProcess(type, text) {
            await chrome.runtime.sendMessage({type: type, text: text}); // await?
        },
    },

    watch: {
        inputText: function (newVal, oldVal) {
            if (newVal !== oldVal) {
                this.debounce(this.spawnProcess, ["inputText", this.inputText], 250);
            }
            if (this.inputText === "") {
                this.$parent.results = []
            }
        }
    }
}

</script>

<style scoped src="./css/animatedInput.css"></style>
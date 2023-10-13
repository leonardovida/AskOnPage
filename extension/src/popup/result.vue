<!-- result.vue -->
<template>
    <div class="result-item" @click="handleClick">
        <div class="result-text">{{ result }}</div>
        <div class="score-box">{{ "0." + Math.round(100 * score) }}</div>
    </div>
</template>

<script>
export default {
    props: {
        result: {
            type: String,
            required: true,
        },
        score: {
            type: Number,
            required: true,
        },
    },
    methods: {
        handleClick() {
            this.$emit('click', this.result);
        },
    },
};
</script>

<style scoped src="./css/result.css"></style>

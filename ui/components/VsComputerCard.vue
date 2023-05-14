<template>
    <v-card class="py-5" style="flex-direction: column">
        <div class="py-3">
            Play Vs Computer
        </div>
        <div class="my-1">
            <template v-if="walletAddress !== ''">
                <choice-block-vs-computer @computer-responded="computerRespondedCallback"></choice-block-vs-computer>
            </template>
        </div>
    </v-card>
</template>

<script>
import ChoiceBlockVsComputer from "./ChoiceBlockVsComputer.vue"

export default {
    components: {
       ChoiceBlockVsComputer
    },
    props: {
        walletAddress: String
    },
    name: "VsComputerCard",
    methods: {
        computerRespondedCallback(tx) {
            console.log("received transaction on the vs-computer card:", tx);
        }
    }
}
</script>

<style scoped>

</style>

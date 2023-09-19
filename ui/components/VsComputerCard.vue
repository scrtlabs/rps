<template>
    <v-card class="py-5" style="flex-direction: column">
        <div>
            Play Vs Computer
        </div>
        <template v-if="walletAddress !== ''">
            <div class="mt-3"/>
            <choice-block-vs-computer @computer-responded="computerRespondedCallback" :key="resetSelection"/>
            <template v-if="computerChoice !== ''">
                <div>Computer's choice: <b>{{ computerChoice }}</b></div>

                <div>Result: <b>{{ result }}</b></div>

                <v-btn class="mt-6" color="error" @click="reset()"> Play Again </v-btn>
            </template>

            <template v-else-if="newGameError !== ''">
                <div class="mt-2 mx-6" style="color: orange">
                    {{ newGameError === '' ? '&nbsp;' : newGameError }}
                </div>

                <v-btn class="mt-6" color="error" @click="reset()"> Play Again </v-btn>
            </template>
        </template>
    </v-card>
</template>

<script>
import ChoiceBlockVsComputer from "./ChoiceBlockVsComputer.vue"

export default {
    data() {
        return {
            computerChoice: "",
            result: "",
            resetSelection: false,
            newGameError: "",
        }
    },
    components: {
       ChoiceBlockVsComputer
    },
    props: {
        walletAddress: String
    },
    name: "VsComputerCard",
    methods: {
        computerRespondedCallback(tx) {
            this.initialView = false;
            let game = tx.jsonLog[0].events
                .find(e => e.type === "wasm-new_rps_vs_computer_game")?.attributes;

            if (game === undefined) {
                this.newGameError = 'The "Vs Computer" section is probably not yet implemented in the contract';
                return;
            }

            let computerChoiceRaw = game.find(a => a.key === "computer_choice").value;

            this.computerChoice = computerChoiceRaw.charAt(0).toUpperCase() + computerChoiceRaw.slice(1); //capitalize
            this.result = game.find(a => a.key === "result").value;
        },

        reset() {
            this.computerChoice = "";
            this.result = "";
            this.resetSelection = !this.resetSelection;
            this.newGameError = "";
        }
    }
}
</script>

<style scoped>

</style>

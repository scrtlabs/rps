<template>
    <div style="display: flex; justify-content: space-around; margin-top: 20px">
        <template v-if="!waitingForResponse">
            <template v-if="selection === ''">
                <v-btn :color="selection === 'Rock'      ? 'success' : ''"   @click="setChoice('Rock')"> Rock </v-btn>
                <v-btn :color="selection === 'Paper'     ? 'success' : ''"   @click="setChoice('Paper')"> Paper </v-btn>
                <v-btn :color="selection === 'Scissors'  ? 'success' : ''"   @click="setChoice('Scissors')"> Scissors </v-btn>
            </template>
            <template v-else>
                <div>Your choice: <b>{{ selection }}</b></div>
            </template>

        </template>
        <template v-else>
            <div>Waiting for Tx...</div>
        </template>
    </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { handleTx } from "../helper"

export default {
    mounted() {},

    data() {
        return {
            selection_vs_computer: "",
            waitingForResponse: false
        }
    },

    computed: {
        ...mapGetters({
            walletAddress: 'getWalletAddress',
            secretjs: 'getSecretJS',
        })
    },

    methods: {
        async setChoice(choice) {
            if (this.selection_vs_computer !== '') // We do not disable the button because we want to show its color
                return;

            this.waitingForResponse = true;
            try {
                let msg = {
                    play_vs_computer: { choice: choice.toLowerCase() },
                }

                let tx = await this.secretjs.tx.compute.executeContract(
                    {
                        sender: this.walletAddress,
                        contract_address: process.env.NUXT_ENV_CONTRACT_ADDRESS,
                        code_hash: process.env.NUXT_ENV_CONTRACT_CODE_HASH,
                        msg,
                        sent_funds: [],
                    },
                    {
                        gasLimit: 1_000_000,
                        gasPriceInFeeDenom: 0.25,
                    }
                );

                let result = handleTx(tx);
                if (result.success) {
                    this.selection_vs_computer = choice;
                }
            } catch (err) {
                console.error("Error sending transaction vs computer:", err);
            }
            this.waitingForResponse = false;
        },
    }
}


</script>

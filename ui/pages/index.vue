<template>
    <v-row justify="center" align="center">
        <v-col cols="12" sm="8" md="6" align="center">
            <v-card class="logo py-4 d-flex justify-center" style="flex-direction: column">
                <div>
                    <img style="width: 100%" src="~/assets/logo.png" />
                </div>

                <div>
                    <template v-if="walletAddress === ''">
                        <v-btn :disabled="walletIsConnecting" @click="connect()"> {{ walletIsConnecting ? 'Connecting...' : 'Connect your wallet' }}</v-btn>
                    </template>
                    <template v-else>
                      <div>Address: {{ shortWalletAddress }}</div>
                      <div><a href="https://faucet.pulsar.scrttestnet.com/" target="_">Get some SCRT</a></div>
                    </template>
                </div>

                <!-- <v-btn @click="test()">TEST</v-btn> -->

                <template v-if="walletAddress !== ''">
                    <div style="margin-top: 20px">
                        <v-btn-toggle mandatory v-if="activeGameCode === ''" v-model="section" tile color="success accent-3" group>
                            <v-btn value="new"> New game </v-btn>
                            <v-btn value="join"> Join existing game </v-btn>
                        </v-btn-toggle>
                    </div>

                    <div v-if="section === 'new'">
                        <!-- CREATE NEW GAME SECTION -->
                        <template v-if="activeGameCode === ''">
                            <v-text-field v-model="playerName" label="Enter your name" :rules="validNameRule" style="width: 70%"></v-text-field>
                            <v-text-field
                                v-model="bet"
                                type="number"
                                :rules="validBetRule"
                                label="Enter your bet"
                                suffix="$SCRT"
                                style="width: 70%"
                            ></v-text-field>

                            <div style="color: orange">
                                {{ newGameError === '' ? '&nbsp;' : newGameError }}
                            </div>

                            <v-btn :disabled="isCreatingNewGame" @click="newGame()">{{ isCreatingNewGame ? 'Creating...' : 'Create Game' }}</v-btn>
                        </template>
                        <template v-else>
                            <div>
                                <b>Active Game Code:</b> {{ activeGameCode }}
                                <v-btn icon @click="copyGamecodeToClipboard()"><v-icon small>mdi-content-copy</v-icon></v-btn>
                            </div>
                            <div><b>Game Status:</b> {{ activeGameStatus }}</div>
                            <!-- <v-btn v-if="activeGameCode != ''" @click="getGameStatus()"> Game status </v-btn> -->


                            <choice-block v-if="allowChoiceSelection" :gameCode="activeGameCode"></choice-block>

                        </template>
                    </div>
                    <div v-else>
                        <!-- JOIN A GAME SECTION -->
                        <template v-if="activeGameCode === ''">
                            <v-text-field v-model="joinGameCode" label="Game Code" :rules="validCodeRule" style="width: 70%"></v-text-field>
                            <v-text-field v-model="playerName" label="Enter your name" :rules="validNameRule" style="width: 70%"></v-text-field>
                            <v-text-field
                                v-model="bet"
                                type="number"
                                :rules="validBetRule"
                                label="Enter your bet"
                                suffix="$SCRT"
                                style="width: 70%"
                            ></v-text-field>


                            <div style="color: orange">
                                {{ joingGameError === '' ? '&nbsp;' : 'Error: ' + joingGameError }}
                            </div>

                            <v-btn :disabled="isJoiningGame" @click="joinGame()">{{ isJoiningGame ? 'Joining...' : 'Join Game' }}</v-btn>
                        </template>
                        <template v-else>
                            <div>
                                <b>Active Game Code:</b> {{ activeGameCode }}
                                <v-btn icon @click="copyGamecodeToClipboard()"><v-icon small>mdi-content-copy</v-icon></v-btn>
                            </div>
                            <div><b>Game Status:</b> {{ activeGameStatus }}</div>

                            <choice-block v-if="allowChoiceSelection" :gameCode="activeGameCode"></choice-block>

                            <template v-if="activeRAWGameStatus === 'WaitingForWinner'">
                                <div>
                                    Calculating winner...
                                </div>
                            </template>
                        </template>
                    </div>
                    <template v-if="winner !== undefined">
                        <template v-if="winner.winner.toLocaleLowerCase() !== 'tie'">
                            <div v-if="winner.address === walletAddress">
                                <img height="150" src="~/assets/winner.gif" />
                            </div>
                            <div v-else>
                                <img height="150" src="~/assets/rps-loser.gif" />
                            </div>
                        </template>
                        <template v-else>
                            <div>Tie!</div>
                        </template>
                        <div>
                            <v-btn color="error" @click="restart()">Restart</v-btn>
                        </div>
                    </template>
                </template>
            </v-card>
        </v-col>
    </v-row>
</template>

<script>
import { mapGetters } from 'vuex'
import { handleTx } from "../helper"

const wsURL = process.env.NUXT_ENV_WS;
let ws = new WebSocket(wsURL);

ws.onopen = function (e) {
    let query =  `tm.event='Tx' AND message.contract_address ='${process.env.NUXT_ENV_CONTRACT_ADDRESS}'`; //`tm.event='"rps_game_coords"' AND acknowledge_packet.packet_channel_ordering.0 = 'ORDER_UNORDERED'`;// AND execute_contract.contract_address='terra1tndcaqxkpc5ce9qee5ggqf430mr2z3pefe5wj6'"`;// `message.module='compute'`; //"tm.event='NewBlock'"; //`message.module='compute'`
    //const CODE_ID = 470;
    //query = query + ` AND message.code_id='${CODE_ID}'`;

    ws.send(
        JSON.stringify({
            jsonrpc: "2.0",
            method: "subscribe",
            params: {
                query,
            },
            id: "tovi-test", // jsonrpc id
        })
    );
};

ws.onmessage = function (event) {
    console.log("--- WS ---");
    console.log(event);
    if (event.data) {
        console.log(JSON.parse(event.data));
    }
    console.log("--- WS ---");
}

ws.onclose = function (event) {
    console.log("WS Closed")
}

ws.onerror = function (error) {
    console.log(`[error] ${error.message}`);
};

export default {
    name: 'IndexPage',
    mounted() {
        this.$nextTick(() => {
            if (window.localStorage.getItem('connectedBefore')) {
                this.connect()
            }

            this.$nuxt.$on('secretjs-loaded', async () => {
                if (this.activeGameCode !== '') {
                    this.getGameStatus();
                    //setTimeout(()=> { this.getGameStatus() }, 1000);
                }
            })
        })
    },
    data() {
        return {
            walletConnecting: false,
            isCreatingNewGame: false,
            isJoiningGame: false,

            section: this.$route.query.section || 'new',
            bet: 1,
            playerName: '',
            joinGameCode: '',
            activeGameCode: this.$route.query.code || '', //'VC1Z6Q2Y',
            activeGameStatus: '',
            activeRAWGameStatus: '',
            statusTimer: null,
            newGameError: '',
            joingGameError: '',
            validBetRule: [(v) => (v && v >= 1) || 'Minimum bet is 1 $SCRT'],
            validNameRule: [(v) => (v && v.trim().length > 0) || 'Name cannot be empty'],
            validCodeRule: [(v) => (v && v.trim().length > 0) || 'Game code cannot be empty'],

            winner: undefined
        }
    },
    computed: {
        ...mapGetters({
            walletAddress: 'getWalletAddress',
            walletErrors: 'getWalletErrors',
            loading: 'getLoading',
            secretjs: 'getSecretJS',
            walletIsConnecting: 'getWalletIsConnecting',
        }),

        hasWebWalletPlugin() {
            return window.keplr !== undefined
        },
        shortWalletAddress() {
            if (this.walletAddress.length > 1) {
                return this.walletAddress.slice(0, 9) + '…' + this.walletAddress.substr(this.walletAddress.length - 3)
            }
            return 'unknown'
        },
        allowChoiceSelection() {
            return ['Started', 'Got1stChoiceWaitingFor2nd'].includes(this.activeRAWGameStatus);
        }
    }, // computed
    methods: {
        async test() {
            let test = await this.secretjs.query.compute.queryContract({
                contract_address: process.env.NUXT_ENV_CONTRACT_ADDRESS,
                code_hash: process.env.NUXT_ENV_CONTRACT_CODE_HASH,
                query: { get_game_by_coords: { game: "aaa", coords: "12345,333333" } },
            });

            console.log(test);

        },

        restart() {
            this.bet = 1;
            this.playerName = '';
            this.joinGameCode = '';
            this.activeGameCode = '';
            this.activeGameStatus = '';
            this.activeRAWGameStatus = '';
            this.newGameError = '';
            this.joingGameError = '';
            this.winner = undefined;

            if (this.statusTimer != null) {
                clearInterval(this.statusTimer);
                this.statusTimer = null;
            }
        },

        connect() {
            this.$store.commit('setWalletIsConnecting', true)
            this.$store.dispatch('initKeplr')
        },

        async newGame() {
            this.isCreatingNewGame = true

            let betCheck = this.validBetRule[0](this.bet)
            if (betCheck !== true) {
                this.newGameError = betCheck
                this.isCreatingNewGame = false
                return
            }

            let nameCheck = this.validNameRule[0](this.playerName)
            if (nameCheck !== true) {
                this.newGameError = nameCheck
                this.isCreatingNewGame = false
                return
            }

            this.newGameError = ''

            let amount = parseInt(parseFloat(this.bet) * 1e6).toString()
            let msg = {
                new_game: {
                    bet: { denom: 'uscrt', amount },
                    player_name: this.playerName,
                },
            }

            try {
                let tx = await this.secretjs.tx.compute.executeContract(
                    {
                        sender: this.walletAddress,
                        contract_address: process.env.NUXT_ENV_CONTRACT_ADDRESS,
                        code_hash: process.env.NUXT_ENV_CONTRACT_CODE_HASH,
                        msg,
                        sent_funds: [{ amount, denom: 'uscrt' }],
                    },
                    {
                        gasLimit: 1_000_000,
                        gasPriceInFeeDenom: 0.25,
                    }
                )

                try {

                    console.log(tx.jsonLog[0].events)
                    for (const k in tx.jsonLog[0].events) {
                        console.log(tx.jsonLog[0].events[k].type)
                        if (tx.jsonLog[0].events[k].type.toLocaleLowerCase() === 'wasm-new_rps_game') {
                            for (const attrIdx in tx.jsonLog[0].events[k].attributes) {
                                if (tx.jsonLog[0].events[k].attributes[attrIdx].key.toLocaleLowerCase() === 'game_code') {
                                    this.activeGameCode = tx.jsonLog[0].events[k].attributes[attrIdx].value
                                    this.getGameStatus()
                                }
                            }
                        }
                    }
                } catch (err) {
                    console.log(err)
                }

                console.log(tx)
            } catch (err) {
                console.log(err)
            }
            this.isCreatingNewGame = false
        },

        async joinGame() {
            this.isJoiningGame = true;

            let codeCheck = this.validCodeRule[0](this.joinGameCode)
            if (codeCheck !== true) {
                this.joingGameError = codeCheck
                this.isJoiningGame = false
                return
            }

            let betCheck = this.validBetRule[0](this.bet)
            if (betCheck !== true) {
                this.joingGameError = betCheck
                this.isJoiningGame = false
                return
            }

            let nameCheck = this.validNameRule[0](this.playerName)
            if (nameCheck !== true) {
                this.joingGameError = nameCheck
                this.isJoiningGame = false
                return
            }

            this.joingGameError = '';

            let amount = parseInt(parseFloat(this.bet) * 1e6).toString()
            let msg = {
                join_game: {
                    game_code: this.joinGameCode,
                    player_name: this.playerName,
                },
            }

            try {
                let tx = await this.secretjs.tx.compute.executeContract(
                {
                    sender: this.walletAddress,
                    contract_address: process.env.NUXT_ENV_CONTRACT_ADDRESS,
                    code_hash: process.env.NUXT_ENV_CONTRACT_CODE_HASH,
                    msg,
                    sent_funds: [{ amount, denom: 'uscrt' }],
                },
                {
                    gasLimit: 1_000_000,
                    gasPriceInFeeDenom: 0.25,
                });

                let result = handleTx(tx);
                if (!result.success) {
                    this.joingGameError = result.error;
                } else {
                    this.activeGameCode = this.joinGameCode;
                    this.getGameStatus();
                }
                console.log(result);

            } catch (err) {
                console.log(err);
            }
            this.isJoiningGame = false;
        },

        async getGameStatus() {
            let self = this;

            let internalGetStatus = async () => {
                let gameInfo = await self.secretjs.query.compute.queryContract({
                    contract_address: process.env.NUXT_ENV_CONTRACT_ADDRESS,
                    code_hash: process.env.NUXT_ENV_CONTRACT_CODE_HASH,
                    query: { game_state: { game: self.activeGameCode } },
                });

                console.log(`Got game state: ${JSON.stringify(gameInfo)}`);

                self.activeRAWGameStatus = gameInfo.state;
                self.activeGameStatus = gameInfo.state.replace(/([a-z0-9])([A-Z])/g, '$1 $2');

                if (this.activeRAWGameStatus === 'Done' && this.winner === undefined) {
                    try {
                      await this.getWinner();
                    } catch (e) {
                      console.log(`Failed to get winner: ${JSON.stringify(e)}`)
                    }
                }

                if (self.statusTimer === null) {
                    console.log('Creating new timer!');
                    self.statusTimer = setInterval(() => {
                        internalGetStatus();
                    }, 1000)
                }
            }

            internalGetStatus();
        },

        // async finalizeGame() {
        //     let msg = {
        //         finalize: { game: this.activeGameCode },
        //     }
        //
        //     let tx = await this.secretjs.tx.compute.executeContract(
        //         {
        //             sender: this.walletAddress,
        //             contractAddress: process.env.NUXT_ENV_CONTRACT_ADDRESS,
        //             codeHash: process.env.NUXT_ENV_CONTRACT_CODE_HASH,
        //             msg,
        //             sentFunds: [],
        //         },
        //         {
        //             gasLimit: 1_000_000,
        //             gasPriceInFeeDenom: 0.25,
        //         }
        //     )
        //     console.log(tx)
        //
        // },

        async getWinner() {
            let gameInfo = await this.secretjs.query.compute.queryContract({
                    contract_address: process.env.NUXT_ENV_CONTRACT_ADDRESS,
                    code_hash: process.env.NUXT_ENV_CONTRACT_CODE_HASH,
                    query: { who_won: { game: this.activeGameCode } },
            });

            console.log(`Got winner from game: ${JSON.stringify(gameInfo)}`);

            this.winner = gameInfo;
        },

        copyGamecodeToClipboard() {
            if (!navigator.clipboard) {
                return
            }
            navigator.clipboard.writeText(this.activeGameCode).then(
                function () {
                    console.log('Async: Copying to clipboard was successful!')
                },
                function (err) {
                    console.error('Async: Could not copy text: ', err)
                }
            )
        },
    }, // methods
}
</script>

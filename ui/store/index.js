import { Wallet, SecretNetworkClient, MsgSend, MsgMultiSend } from "secretjs";
import { keplrSuggestChain } from "../helper"


export const state = () => ({
    walletAddress: '',
    walletErrors: '',
    loading: false,

    secretJS: null,

    walletIsConnecting: false

});



export const mutations = {
    setLoading(state, loading) {
        state.loading = loading;
    },

    setWalletError(state, error) {
        if (error) {
            console.log("Error: ", error);
        }
        state.walletErrors = error;
    },

    setWalletAddress(state, address) {
        state.walletAddress = address;
    },

    setSecretJS(state, object) {
        state.secretJS = object;
        $nuxt.$emit('secretjs-loaded');
    },

    setWalletIsConnecting(state, value) {
        state.walletIsConnecting = value;
    }
}

export const actions = {
    initKeplr({ commit, state }) {
        var keplrConnect = async (addEvent) => {
            console.log('Init keplr wallet...');
            commit('setWalletIsConnecting', true);
            commit('setLoading', true);
            commit('setWalletError', '');
            addEvent = typeof addEvent == 'undefined' ? true : addEvent;
            if (!window.keplr || !window.getEnigmaUtils || !window.getOfflineSignerOnlyAmino) {
                commit('setLoading', false);
                commit('setWalletError', 'Cannot find Keplr wallet');
                commit('setWalletIsConnecting', false);
            } else {
                var suggestChain = false;
                try {
                    await window.keplr.enable(process.env.NUXT_ENV_CHAIN_ID);
                } catch (err) {
                    commit('setWalletIsConnecting', false);
                    if (err.message.indexOf("no chain info") !== -1) {
                        suggestChain = true;
                    } else {
                        return;
                    }
                }

                try {
                    if (suggestChain) {
                        await keplrSuggestChain();
                    }

                    const keplrOfflineSigner = window.getOfflineSignerOnlyAmino(process.env.NUXT_ENV_CHAIN_ID);
                    const signer = await keplrOfflineSigner.getAccounts();
                    let walletAddress = signer[0].address;
                    commit('setWalletAddress', walletAddress);

                    let secretJS = new SecretNetworkClient({
                        url: process.env.NUXT_ENV_REST_URL,
                        chainId: process.env.NUXT_ENV_CHAIN_ID,
                        wallet: keplrOfflineSigner,
                        walletAddress: walletAddress,
                        encryptionUtils: window.getEnigmaUtils(process.env.NUXT_ENV_CHAIN_ID),
                    });
                    commit('setSecretJS', secretJS);
                    commit('setLoading', false);
                    commit('setWalletError', '');
                    commit('setWalletIsConnecting', false);

                    // Save an indication that this site already connected before so we can
                    // automaticaly connect in the next time
                    window.localStorage.setItem('connectedBefore', '1');

                    if (addEvent) {
                        window.addEventListener('keplr_keystorechange', () => {
                            keplrConnect(false);
                        });
                    }
                } catch (err) {
                    console.log("----")
                    console.log(err.message);
                    console.log("----")
                    commit('setLoading', false);
                    commit('setWalletError', err); //'Cannot connect to your wallet<br>Please make sure Keplr is installed properly'
                    commit('setWalletIsConnecting', false);
                }

            }
        };
        setTimeout(keplrConnect, 1000);

    }
}

export const getters = {
    getLoading(state) {
        return state.loading;
    },

    getSecretJS(state) {
        return state.secretJS;
    },

    getWalletAddress(state) {
        return state.walletAddress;
    },

    getWalletErrors(state) {
        return state.walletErrors;
    },

    getWalletIsConnecting(state) {
        return state.walletIsConnecting;
    }
}

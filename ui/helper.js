const { TxResultCode } = require('secretjs')

export const handleTx = (tx) => {
    var result = false
    var error = ''
    console.log(`Gas used: ${tx.gasUsed}`)
    console.log(tx)
    if (tx.code !== TxResultCode.Success) {
        result = false
        if (tx.rawLog) {
            let errorPos = tx.rawLog.indexOf('Generic error:')
            if (errorPos > 0) {
                error = tx.rawLog.substring(errorPos + 'Generic error: '.length)
                try {
                    error = error.split(':')[0]
                } catch (err) {}
            }
        }
        if (error === '') {
            error = JSON.stringify(tx.jsonLog || tx)
        }
        console.log(error)
        console.error(tx, `Failed to run`)
    } else {
        result = true
    }
    return { success: result, error: error }
}

export const keplrSuggestChain = async () => {
    await window.keplr.experimentalSuggestChain({
        rpc: process.env.NUXT_ENV_RPC_URL,
        rest: process.env.NUXT_ENV_REST_URL,
        chainId: process.env.NUXT_ENV_CHAIN_ID,
        chainName: process.env.NUXT_ENV_CHAIN_ID,
        stakeCurrency: {
          coinDenom: "SCRT",
          coinMinimalDenom: "uscrt",
          coinDecimals: 6,
          coinGeckoId: "secret",
        },
        bip44: {
          coinType: 529,
        },
        bech32Config: {
          bech32PrefixAccAddr: "secret",
          bech32PrefixAccPub: "secret" + "pub",
          bech32PrefixValAddr: "secret" + "valoper",
          bech32PrefixValPub: "secret" + "valoperpub",
          bech32PrefixConsAddr: "secret" + "valcons",
          bech32PrefixConsPub: "secret" + "valconspub",
        },
        currencies: [
          {
            coinDenom: "SCRT",
            coinMinimalDenom: "uscrt",
            coinDecimals: 6,
            coinGeckoId: "secret",
          },
        ],
        feeCurrencies: [
          {
            coinDenom: "SCRT",
            coinMinimalDenom: "uscrt",
            coinDecimals: 6,
            coinGeckoId: "secret",
          },
        ],
        gasPriceStep: { low: 0.1, average: 0.25, high: 0.3 },
        features: ["secretwasm"],
    });
}
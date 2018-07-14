window.addEventListener('load', function () {
  if (typeof web3 !== 'undefined') {
    console.log('Web3 Detected! ' + web3.currentProvider.constructor.name)
    window.web3 = new Web3(web3.currentProvider);
  } else {
    console.log('No Web3 Detected... using HTTP Provider')
    window.web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/<APIKEY>"));
  }
})

const promisify = (inner) =>
  new Promise((resolve, reject) =>
    inner((err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    })
  );

async function getBalance() {
  var address, wei, balance
  address = document.getElementById("address").value;
  wei = promisify(cb => web3.eth.getBalance(address, cb))
  try {
    balance = web3.fromWei(await wei, 'ether')
    document.getElementById("output").innerHTML = balance + " ETH";
  } catch (error) {
    document.getElementById("output").innerHTML = error;
  }
}

async function getERC20Balance() {
  var address, contractAddress, contractABI, tokenContract, decimals, balance, name, symbol, adjustedBalance
  address = document.getElementById("address").value
  contractAddress = document.getElementById("contractAddress").value
  contractABI = human_standard_token_abi

  tokenContract = web3.eth.contract(contractABI).at(contractAddress)

  decimals = promisify(cb => tokenContract.decimals(cb))
  balance = promisify(cb => tokenContract.balanceOf(address, cb))
  name = promisify(cb => tokenContract.name(cb))
  symbol = promisify(cb => tokenContract.symbol(cb))

  try {
    adjustedBalance = await balance / Math.pow(10, await decimals)
    document.getElementById("output2").innerHTML = adjustedBalance;
    document.getElementById("output2").innerHTML += " " + await symbol + " (" + await name + ")";
  } catch (error) {
    document.getElementById("output2").innerHTML = error;
  }
}

function appendToLocalStorage(datum, localStorageName) {
  if (typeof(Storage) !== "undefined") {
    if (datum) {
      let data;
      if (localStorage.getItem(localStorageName)) {
        if (localStorage[localStorageName].includes(datum)) {
          return;
        }
        data = JSON.parse(localStorage.getItem(localStorageName));
      } else {
        data = [];
      }
      data.push(datum);
      localStorage.setItem(localStorageName, JSON.stringify(data));
      // console.log(localStorage[localStorageName])
    }
  } else {
    console.log("Your browser does not support web storage")
  }
}

// Get the first transaction block for an address
async function getTxBalances(address) {
  var response = await fetch("https://api.etherscan.io/api?module=account&action=txlist&address=" + address + "&startblock=0&page=1&offset=10&sort=asc");
  var data = await response.json();
  var balances = [];
  for ( i=0; i < data.result.length; i++ ) {
    let balance = getBalanceAtBlock(address, data.result[i].blockNumber);
    balances.push(balance);
  };
 
  return balances;
}

async function getBalanceAtBlock(address, blockNumber) {
  let wei = web3.eth.getBalance(address, blockNumber);
  let ether = parseFloat(web3.fromWei(wei, 'ether'));

  return ether;
}

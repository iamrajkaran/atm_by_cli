const readline = require('readline');
const fs = require('fs');
let financeInfo = {
	// user: {
	// 	balance,
    //  totalDebit,
	// 	debit: {
	// 		userB: 10,
	// 	},
    //  totalCredit,
	// 	credit: {
	// 		userC: 100.
	// 		userB: 20
	// 	},
	// }
};
let logInInfo = {
    currentLogin: 'N/A',
    loggedInUsers: {
        // userId: {
        //     name,
        //     lastLoggedIn,
        //     lastLoggedOut,
        // }
    }
};

const _setFinanceInfo = (financeInfoData) => {
    financeInfo = financeInfoData;
};
const _setLoginInfo = (logInInfoData) => {
    logInInfo = logInInfoData;
};

const _loadFromMemory = () => new Promise((resolve, reject) => {
    if (fs.existsSync('./persistentData.txt')) {
        fs.readFile('./persistentData.txt', 'utf8', (err, data) => {
            if (err) {
                console.error('Something went wrong', err);
            } else {
                const parseData = data.length > 0 ? JSON.parse(data) : {};
                if (Object.keys(parseData).length === 0
                || Object.keys(parseData.financeInfo).length === 0
                || Object.keys(parseData.logInInfo).length === 0) {
                    console.error('Something went wrong with previous states, so start with new');
                    return resolve('done');
                }
                _setFinanceInfo(parseData.financeInfo);
                _setLoginInfo(parseData.logInInfo);
                console.log("Last state of Data loaded in memory successfully");
                console.log(financeInfo);
                console.log(logInInfo);
                resolve('done');
            }
        });
    } else {
        console.log('No file exists to load, no worries, it will create one on exit');
        resolve('done');
    }
});

const _saveInMemory = () => new Promise((resolve, reject) => {
    const dataToSave = JSON.stringify({
        financeInfo,
        logInInfo,
    });
    fs.writeFile('./persistentData.txt', dataToSave, (err) => {
        if (err) {
            console.error('Something went wrong', err);
            reject(err);
        } else {
            console.log("File written successfully");
            resolve('done');
        }
    });
});

const _isNotLoggedIn = () => logInInfo.currentLogin === 'N/A';
const _resetCurrentLogin = () => {
    logInInfo.currentLogin = 'N/A';
};

const _showAvailableCommands = ({excludeService}) => {
    console.log("*************************************************************");
    if (excludeService === 'N/A' || excludeService !== 'login') console.info('login [name] ex - login User1');
    if (excludeService === 'N/A' || excludeService !== 'logout') console.info('logout [name] ex - logout User1');
    console.info('deposit [amount] ex - deposit 500');
    console.info('transfer [name] [amount] ex - transfer User2 500');
    console.info('withdraw [amount] ex - withdraw 500');
    console.info('exit ex - exit');
    console.log("*************************************************************");
};

const _operationsList = ({ excludeService, }) => {
    console.info('Choose any of operations and {input params} to perform');
    _showAvailableCommands({ excludeService });
}

const _balanceInfo = (userName) => {
    let monetaryValue = 0;
    if (financeInfo[userName]) {
        monetaryValue = financeInfo[userName].balance || 0;
        console.log(`Your balance is $${monetaryValue}`);
        Object.keys(financeInfo[userName].credit || {}).forEach((owedUser) => {
            if (financeInfo[userName].credit[owedUser] > 0) {
                console.log(`Owed $${financeInfo[userName].credit[owedUser]} from ${owedUser}`);
            }
        });
        Object.keys(financeInfo[userName].debit || {}).forEach((owedUser) => {
            if (financeInfo[userName].debit[owedUser] > 0) {
                console.log(`Owed $${financeInfo[userName].debit[owedUser]} to ${owedUser}`);
            }
        });
    } else {
        console.log(`Your balance is $${monetaryValue}`);
    }
}

const login = (operationInput) => {
    const userName = operationInput.join(' ');
    if (logInInfo.currentLogin !== 'N/A') {
        console.log(`${logInInfo.currentLogin} is already logged in`);
        console.log(`Let, ${logInInfo.currentLogin} logout first`);
        return;
    }
    logInInfo.currentLogin = userName;

    // register user
    logInInfo.loggedInUsers[userName] = logInInfo.loggedInUsers[userName] || {};
    logInInfo.loggedInUsers[userName].name = userName;
    logInInfo.loggedInUsers[userName].lastLoggedIn = new Date();
    financeInfo[userName] = financeInfo[userName] || {
        balance: 0,
        totalDebit: 0,
        totalCredit: 0,
        debit: {},
        credit: {},
    };

    console.log(`Hello, ${logInInfo.currentLogin}`);
    _balanceInfo(userName);
    console.log('=================================');
    _operationsList({excludeService: 'login' });
};
const logout = (operationInput) => {
    const userName = operationInput.join(' ');
    if (logInInfo.currentLogin === 'N/A') {
        console.log('No one is logged in');
        _operationsList({excludeService: 'logout' });
        return;
    }

    if (logInInfo.currentLogin !== userName) {
        console.log(`Requesting user ${userName} was not logged in, ${logInInfo.currentLogin} is logged in`);
        _operationsList({excludeService: 'logout' });
        return;
    }

    _resetCurrentLogin();
    logInInfo.loggedInUsers[userName].lastLoggedOut = new Date();

    console.log(`Goodbye, ${userName}`);
    console.log('=================================');
    _operationsList({excludeService: 'logout' });
};
const deposit = (operationInput) => {
    let amount = parseInt(operationInput[0], 10);

    if (amount < 0 || isNaN(amount)) {
        console.log('Amount should be positive integer');
        _operationsList({excludeService: 'login' });
        return;
    }
    if (_isNotLoggedIn()) {
        console.log('User Not logged in, please login first');
        _operationsList({excludeService: 'logout' });
        return;
    }
    const currentLoggedInUser = logInInfo.currentLogin;

    // clearDuesOnDepositIfAny
    // Case 1: If there is no debt
    if (financeInfo[currentLoggedInUser].totalDebit === 0) {
        financeInfo[currentLoggedInUser] = financeInfo[currentLoggedInUser] || {};
        financeInfo[currentLoggedInUser].balance += amount;
    } else {  // Case 2: If user has debt that is user has to owe and Get all the users with whom currentUser has to owe
        Object.keys(financeInfo[currentLoggedInUser].debit)
        .forEach((owedUser) => {
            if (amount > 0 && financeInfo[currentLoggedInUser].totalDebit > 0) {
                // Case 2.1: If amount to deposit is greater than or equal to owed amount with user
                if (amount >= financeInfo[currentLoggedInUser].debit[owedUser]) {
                    let currentAmountBeforeDeduct = amount;
                    amount -= financeInfo[currentLoggedInUser].debit[owedUser];

                    financeInfo[currentLoggedInUser].debit[owedUser] = 0;
                    const remainingAmountOfTotalDebit = financeInfo[currentLoggedInUser].totalDebit - currentAmountBeforeDeduct;
                    financeInfo[currentLoggedInUser].totalDebit = remainingAmountOfTotalDebit < 0 ? 0 : remainingAmountOfTotalDebit;

                    financeInfo[owedUser].credit[currentLoggedInUser] = 0;
                    const remainingAmountOfTotalCredit = financeInfo[owedUser].totalCredit - currentAmountBeforeDeduct;
                    financeInfo[owedUser].totalCredit = remainingAmountOfTotalCredit < 0 ? 0 : remainingAmountOfTotalCredit;

                    financeInfo[owedUser].balance += currentAmountBeforeDeduct;
                } else {
                    // Case 2.2: If amount to deposit is less than amount user has to owe
                    financeInfo[currentLoggedInUser].debit[owedUser] -= amount;
                    financeInfo[currentLoggedInUser].totalDebit -= amount;


                    financeInfo[owedUser].credit[currentLoggedInUser] -= amount;
                    financeInfo[owedUser].totalCredit -= amount;
                    financeInfo[owedUser].balance += amount;
                    amount = 0;
                }
            } else {
                return; // break the loop in case deposit amount is 0 and there is no debt left
            }
        });
        // If amount still exist after paying all debt, then add it to balance of current logged in user
        if (amount > 0) financeInfo[currentLoggedInUser].balance += amount;
    }

    _balanceInfo(currentLoggedInUser);
    console.log('=================================');
    _operationsList({excludeService: 'login' });
};
const transfer = (operationInput) => {
    const [transfereeName, amountInString] = operationInput;
    let amount = parseInt(amountInString, 10);
    if (amount < 0) {
        console.log('Amount should be positive integer');
        _operationsList({excludeService: 'login' });
        return;
    }
    if (isNaN(parseInt(amountInString, 10))) {
        console.log('Input is not correct');
        _operationsList({excludeService: 'login' });
        return;
    }

    const currentLoggedInUser = logInInfo.currentLogin;
    if (_isNotLoggedIn()) {
        console.log('User Not logged in, please login first');
        _operationsList({excludeService: 'logout' });
        return;
    }
    if (!logInInfo.loggedInUsers[transfereeName]) {
        console.log('Unknown user, never logged in.');
        return;
    }

    // Case 1: If user has balance greater than equal to amount
    if (financeInfo[currentLoggedInUser].balance >= amount) {
        financeInfo[currentLoggedInUser].balance -= amount;
        financeInfo[transfereeName].balance += amount;
    } else {
    // Case 2: If transfer amount > balance
        // Case 2.1: If user has balance
        if (financeInfo[currentLoggedInUser].balance > 0) {
            let remainingAmount = amount - financeInfo[currentLoggedInUser].balance;
            financeInfo[transfereeName].balance += financeInfo[currentLoggedInUser].balance;

            // current user finance
            financeInfo[currentLoggedInUser].debit[transfereeName] = financeInfo[currentLoggedInUser].debit[transfereeName] ? financeInfo[currentLoggedInUser].debit[transfereeName] + remainingAmount : remainingAmount;
            financeInfo[currentLoggedInUser].totalDebit += remainingAmount || 0;

            // transferee finance
            financeInfo[transfereeName].credit[currentLoggedInUser] = financeInfo[transfereeName].credit[currentLoggedInUser] ? financeInfo[transfereeName].credit[currentLoggedInUser] + remainingAmount : financeInfo[currentLoggedInUser].debit[transfereeName];
            financeInfo[transfereeName].totalCredit += remainingAmount || 0;

            financeInfo[currentLoggedInUser].balance = 0;
        } else {
            // Case 2.2: If user has no balance
            // current user finance
            financeInfo[currentLoggedInUser].debit[transfereeName] = financeInfo[currentLoggedInUser].debit[transfereeName] ? financeInfo[currentLoggedInUser].debit[transfereeName] + amount : amount;
            financeInfo[currentLoggedInUser].totalDebit += amount;

            // transferee finance
            financeInfo[transfereeName].credit[currentLoggedInUser] = financeInfo[transfereeName].credit[currentLoggedInUser] ? financeInfo[transfereeName].credit[currentLoggedInUser] + amount : financeInfo[currentLoggedInUser].debit[transfereeName];
            financeInfo[transfereeName].totalCredit += amount;
        }
    }

    console.log(`Transferred $${amount} to ${transfereeName}`);
    _balanceInfo(currentLoggedInUser);
    console.log('=================================');
    _operationsList({excludeService: 'login' });
};
const withdraw = (operationInput) => {
    let amount = parseInt(operationInput[0], 10);

    if (amount < 0 || isNaN(amount)) {
        console.log('Amount should be positive integer');
        _operationsList({excludeService: 'login' });
        return;
    }
    if (_isNotLoggedIn()) {
        console.log('User Not logged in, please login first');
        _operationsList({excludeService: 'logout' });
        return;
    }
    const currentLoggedInUser = logInInfo.currentLogin;

    if (amount <= financeInfo[currentLoggedInUser].balance){
        financeInfo[currentLoggedInUser].balance -= amount;
    } else {
        shortageMoneyInBalance = amount - financeInfo[currentLoggedInUser].balance;
        console.log(`Not enough money to withdraw, shortage of ${shortageMoneyInBalance} amount in balance`)
    }
    _balanceInfo(currentLoggedInUser);
    console.log('=================================');
    _operationsList({excludeService: 'login' });
};
const exit = async () => {
    console.log('As you wish, see you again'); // save in memory if any previous state exist
    _resetCurrentLogin();
    console.log('Last saved state', financeInfo, logInInfo);
    await _saveInMemory();
    process.exit();
};

const operations = {
    login,
    logout,
    deposit,
    transfer,
    withdraw,
    exit,
}

// Call when User enter input
const readArgs = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
readArgs.on('line', (input) => {
    try {
        // Process user input as needed
        console.log(`Received input: ${input}`);
        const operationInput = input.split(' ');
        const operationChosen = operationInput[0];
        console.log(`OperationChosen chosen: ${operationChosen}`);
        console.log('=================================');
        if (!operations[operationChosen]) { console.error('Invalid command'); return; }
        operations[operationChosen](operationInput.slice(1));
    } catch(err) {
        console.error(err); // Enable it for debugging, since command line is user interface here
        console.log('Something went wrong');
        console.log('Lets try again');
        _operationsList({ excludeService: 'N/A'});
    }
});

// On launch of ATM program
const _welcomeMessage = async () => {
    await _loadFromMemory();   // load in memory if any previous state exist
    console.log('Welcome to ATM');
    _operationsList({ excludeService: 'N/A'});
}
_welcomeMessage();

process.on('uncaughtException', (error, source) => {
    console.error('Something went wrong to ATM program', error.stack);
});

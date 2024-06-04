class Currency {
    constructor(code, name) {
        this.code = code;
        this.name = name;
    }
}

class CurrencyConverter {
    constructor(apiUrl) {
        this.apiUrl = apiUrl;
        this.currencies = [];
    }

    async getCurrencies() {
        try {
            const response = await fetch(`${this.apiUrl}/currencies`);
            const data = await response.json();
            Object.keys(data).forEach((key) => {
                const currency = new Currency(key, data[key]);
                this.currencies.push(currency);
            });
        } catch (error) {
            console.error('Error al obtener las monedas:', error);
        }
    }

    async convertCurrency(amount, fromCurrency, toCurrency) {
        if (fromCurrency.code === toCurrency.code) {
            return amount;
        }
        
        try {
            const response = await fetch(`${this.apiUrl}/latest?amount=${amount}&from=${fromCurrency.code}&to=${toCurrency.code}`);
            const data = await response.json();
            return data.rates[toCurrency.code] * amount;
        } catch (error) {
            console.error('Error al convertir moneda:', error);
            return null;
        }
    }

    async getExchangeRatesForDate(date) {
        try {
            const response = await fetch(`${this.apiUrl}/${date}`);
            const data = await response.json();
            return data.rates;
        } catch (error) {
            console.error(`Error al obtener tasas de cambio para la fecha ${date}:`, error);
            return null;
        }
    }

    async compareExchangeRates(toCurrencyCode) {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const formattedYesterday = yesterday.toISOString().split('T')[0];
        const urlToday = `${this.apiUrl}/latest`;
        const urlYesterday = `${this.apiUrl}/${formattedYesterday}`;

        try {
            const responseToday = await fetch(urlToday);
            const dataToday = await responseToday.json();

            const responseYesterday = await fetch(urlYesterday);
            const dataYesterday = await responseYesterday.json();

            const rateToday = dataToday.rates[toCurrencyCode];
            const rateYesterday = dataYesterday.rates[toCurrencyCode];
            const difference = rateToday - rateYesterday;

            return { rateToday, rateYesterday, difference };
        } catch (error) {
            console.error('Error al comparar tasas de cambio:', error);
            return null;
        }
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById("conversion-form");
    const resultDiv = document.getElementById("result");
    const fromCurrencySelect = document.getElementById("from-currency");
    const toCurrencySelect = document.getElementById("to-currency");

    const converter = new CurrencyConverter("https://api.frankfurter.app");

    await converter.getCurrencies();
    populateCurrencies(fromCurrencySelect, converter.currencies);
    populateCurrencies(toCurrencySelect, converter.currencies);

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const amount = document.getElementById("amount").value;
        const fromCurrency = converter.currencies.find(
            (currency) => currency.code === fromCurrencySelect.value
        );
        const toCurrency = converter.currencies.find(
            (currency) => currency.code === toCurrencySelect.value
        );

        const convertedAmount = await converter.convertCurrency(
            amount,
            fromCurrency,
            toCurrency
        );

        if (convertedAmount !== null && !isNaN(convertedAmount)) {
            const { rateToday, rateYesterday, difference } = await converter.compareExchangeRates(toCurrency.code);
            resultDiv.innerHTML = `
                ${amount} ${fromCurrency.code} son ${convertedAmount.toFixed(2)} ${toCurrency.code}<br>
                Tasa de cambio hoy: ${rateToday}<br>
                Tasa de cambio ayer: ${rateYesterday}<br>
                Diferencia: ${difference}
            `;
        } else {
            resultDiv.textContent = "Error al realizar la conversión.";
        }
    });

    function populateCurrencies(selectElement, currencies) {
        if (currencies) {
            currencies.forEach((currency) => {
                const option = document.createElement("option");
                option.value = currency.code;
                option.textContent = `${currency.code} - ${currency.name}`;
                selectElement.appendChild(option);
            });
        }
    }
});

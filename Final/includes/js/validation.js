//script purely for handling the validation of the checkout field... thought putting it on it's own was a smart thing to do since it's big
//i spent a whole week trying to break this, re-writing it etc. if i missed something, that's why haa.
//regex

//the submission instructions said to allow a 3 or 4 digit CVV, but the Submission API only accepts 3, so I'm going to assume that it's only supposed to be 3.

const regFirstName = /^[a-zA-Z]+$/;
const regLastName = /^[a-zA-Z-]+$/;
const regAddress = /^(\d+)\s+([\w\s]+?)\s+(?:(?:(?:Avenue|Ave|Street|St|Road|Rd|Lane|Ln|Drive|Dr|Boulevard|Blvd|Court|Ct|Place|Pl|Square|Sq|Terrace|Ter|Trail|Trl|Highway|Hwy)\b)|([\w\s]+))$/i;
const regSecondAddress = /(?:\b(?:2nd|Second|Basement|Suite|Apt|Apartment|Unit|Room|Studio|Bsmt)\b)\s*(\d+)?\s*([\w\s]+)/i;
const regCity =  /^[a-zA-Z]+(?:\s[a-zA-Z]+)*$/;
const regEmail = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
const canRegPostal = /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d$/i;
const usaRegPostal = /^\d{5}$/;
const regPhone = /^(1[- ]?)?(\d{3}[- ]?\d{3}[- ]?\d{4}|\(\d{3}\)\s*\d{3}[- ]?\d{4}|\d{3}[- ]?\d{7})$/
const cvcRegex = /^\d{3}$/; 
const ccRegex = /^(\d{4}\s\d{4}\s\d{4}\s\d{4}|\d{16})$/;
const monthRegex = /^(0[1-9]|1[0-2]|10|11|12)$/;
const yearRegex = /^(?:20)\d\d$/;
const currentYear = new Date().getFullYear(); //get current date for credit card validaton later
const currentMonth = new Date().getMonth() + 1;
const submission = {};

//billing variables
let billingFirstName;
let billingLastName;
let billingAddress;
let billingAddress2;
let billingCountry;
let billingProvince;
let billingCity;
let billingPostalCode;
let billingPhone;
let billingEmail;
let billingCcNumber;
let billingCcMonth;
let billingCcYear;
let billingCvc;

//shipping variables
let shippingFirstName;
let shippingLastName;
let shippingAddress;
let shippingAddress2;
let shippingCountry;
let shippingProvince;
let shippingCity;
let shippingPostalCode;
let shippingPhone;
let shippingEmail;

//booleans
let isBillingFormValid = false;
let isShippingFormValid = false;
let isCreditCardFormValid = false;

//total variables
let grandTotal;
let currency;

//for API call later
let form_data = new FormData();

const submitFunction = async(form_data) => { //submission API
    try {
        let response = await fetch(`https://deepblue.camosun.bc.ca/~c0180354/ics128/final/`,{ 
            method: `POST`,
            cache: `no-cache`,
            body: form_data
        });

        if (response.ok) {
            $(`#checkoutModal`).modal(`hide`); //show successful modal
            $(`#successModal`).modal(`show`);
            $(`#submitOrderBtn`).html(`Submit Order`); //reset the button animation
        }
    }
    catch(error) {
        throw new Error(`Something went wrong... please try again later.`);
    }
}

$(document).ready(function() { 
    $(`#submitOrderBtn`).hide(); //initially hiding these buttons
    $(`#backBtn`).hide();
    $(`#submitOrderError`).hide();

    // continue/back button logic in the checkout modal
    $(`#continueBtn`).click(function() {
        let currentLink = $(`.nav-link.active`);
        let nextLink = currentLink.closest(`li.nav-item`).next().find(`.nav-link`);
        let targetTab = $(nextLink.attr(`data-bs-target`));

        if (nextLink.attr(`id`) === `pills-confirmation-tab`) {
            $(`#submitOrderBtn`).show();
            $(`#continueBtn`).hide();
        }

        currentLink.removeClass(`active`);
        nextLink.addClass(`active`);
        $(`.tab-pane`).removeClass(`show active`);
        targetTab.addClass(`show active`);
        nextLink.trigger(`click`);
    });
    
    $(`#backBtn`).click(function() {
        let currentLink = $(`.nav-link.active`);
        let prevLink = currentLink.closest(`li.nav-item`).prev().find(`.nav-link`);
        let targetTab = $(prevLink.attr(`data-bs-target`));

        if (prevLink.attr(`id`) === `pills-billing-tab`) {
            $(`#backBtn`).hide();
        }
        else {
            $(`#backBtn`).show();
        }

        currentLink.removeClass(`active`);
        prevLink.addClass(`active`);
        $(`.tab-pane`).removeClass(`show active`);
        targetTab.addClass(`show active`);
        prevLink.trigger(`click`);
    });
    
    //create a delay function to simulate submitting
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    //submit orderbutton handler/JS object building
    $(`#submitOrderBtn`).click(function() {
        $(`#submitOrderBtn`).html(`<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Submitting...`); //show animation
        $(`#submitOrderError`).hide(); //hide error message if it's showing
        setTimeout(function() { //creating a delay to simulate submission
            billingValidate(); //validate the 3 forms one last time before submission incase a field was missed
            shippingValidate();
            validateCreditCard();

            if (isShippingFormValid && isCreditCardFormValid && isBillingFormValid) { //if all 3 are valid
                delay(2000).then(() => { //creating a delay to simulate submission 
                    billingCcNumber = billingCcNumber.replace(/\s/g, ``); //stripping spaces
                    billingPhone = billingPhone.replace(/\s/g, ``); //strip spaces
                    submission.card_number = billingCcNumber; //building the JS object
                    submission.expiry_month = billingCcMonth; 
                    submission.expiry_year = billingCcYear;
                    submission.security_code = billingCvc;
                    grandTotal = $(`#grandTotal`).text(); //getting the value from the table, stripping the $ and converting it to fixed 2 decimal places
                    grandTotal =  parseFloat(grandTotal.replace(/[^\d.-]/g, ``));
                    grandTotal = grandTotal.toFixed(2);
                    submission.amount = grandTotal;
                    currency = $(`#currencyDropdown .dropdown-item.active`).data(`currency`); //getting the selected currency
                    currency = currency.toLowerCase(); //converting to lowercase
                    submission.currency = currency; 
                    billingCountry = billingCountry.slice(0,-1); //removing the last character from the country value
                    let newBillingObj = { //billing JS object
                        first_name: billingFirstName,
                        last_name: billingLastName,
                        address_1: billingAddress,
                        address_2: billingAddress2,
                        city: billingCity,
                        province: billingProvince,
                        country: billingCountry,
                        postal: billingPostalCode,
                        phone: billingPhone,
                        email: billingEmail
                    }
                    submission.billing = newBillingObj;

                    if ($(`#sameInfo`).prop(`checked`)) { //if the same info as billing checkbox is checked, then assign the billing object to the shipping object
                        shippingFirstName = $(`#billingFirstName`).val();
                        shippingLastName = $(`#billingLastName`).val();
                        shippingAddress = $(`#billingAddress`).val();
                        shippingAddress2 = $(`#billingSecondAddress`).val();
                        shippingCountry = $(`#billingCountry`).val();
                        shippingCountry = shippingCountry.slice(0,-1);
                        shippingProvince = $(`#billingProvince`).val();
                        shippingCity = $(`#billingCity`).val();
                        shippingPostalCode = $(`#billingZip`).val();
                        shippingPhone = $(`#billingPhone`).val();
                        shippingPhone = billingPhone.replace(/\s/g, ``);
                        shippingEmail = $(`#billingEmail`).val();
                        let newShippingObj = { //shipping JS object
                            first_name: shippingFirstName,
                            last_name: shippingLastName,
                            address_1: shippingAddress,
                            address_2: shippingAddress2,
                            city: shippingCity,
                            province: shippingProvince,
                            country: shippingCountry,
                            postal: shippingPostalCode,
                            phone: shippingPhone,
                            email: shippingEmail
                        }
                        submission.shipping = newShippingObj;
                    }
                    else {
                        shippingCountry = shippingCountry.slice(0,-1);
                        billingPhone = billingPhone.replace(/\s/g, ``);
                        let newShippingObj = { //shipping JS object
                            first_name: shippingFirstName,
                            last_name: shippingLastName,
                            address_1: shippingAddress,
                            address_2: shippingAddress2,
                            city: shippingCity,
                            province: shippingProvince,
                            country: shippingCountry,
                            postal: shippingPostalCode,
                            phone: shippingPhone,
                            email: shippingEmail
                        }
                        submission.shipping = newShippingObj;
                    }
                    form_data.append(`submission`, JSON.stringify(submission)); 
                    try {
                        submitFunction(form_data).then(() =>{  //trying to submit the form data
                            cartItems = get_cookie(`shopping_cart_items`); //if successful, then remove all items from cart and update counter/tables
                            for (let productID in cartItems) {
                                if (cartItems.hasOwnProperty(productID)) {
                                    delete cartItems[productID];
                                }
                            }
                            set_cookie(`shopping_cart_items`, cartItems); //update cookie and checkout tables
                            updateCartCounter(selectedCurrency);
                            subtotalCheckoutTable(selectedCurrency);
                            checkoutModal(selectedCurrency);
                        }).catch((error) => { //handles any error that might occur during submitFunction call
                            $(`#submitOrderError`).html(error).css(`color`, `red`).css(`text-align`, `center`);
                            $(`#submitOrderError`).show();
                            $(`#submitOrderBtn`).html(`Submit Order`);
                        })
                    }
                    catch (error) { //catches any error that might occur during the try
                        $(`#submitOrderError`).html(`Please try again`).css(`color`, `red`).css(`text-align`, `center`);
                        $(`#submitOrderError`).show();
                      }
                    }, 2000);
                  }
                  else { //if any of the forms are invalid, show error.
                    $(`#submitOrderBtn`).html(`Submit Order`);
                    $(`#submitOrderError`).show();
                  }
                }, 2000);

        $(`#closeSuccessMsg`).click(function() {
            window.scrollTo(0,0) //setting a time out when closing the modal to refresh page and take you to the top of the page
            setTimeout(function() {
                $(`#offcanvasClose`).click(); //close the modal
                location.reload();
            }, 500);
        });
    });

    $(`#sameInfo`).click(function() { //if same information button is clicked, toggle the visibility of shipping form
        $(`#shippingForm`).toggle();
    });
    
    //functions to validate fields on submit order click
    function billingValidate() {
        billingFirstNameValidate();
        billingLastNameValidate();
        billingAddressValidate();
        billingCountryValidate();
        billingProvinceValidate();
        billingCityValidate();
        billingPostalValidate();
        billingPhoneValidate();
        billingEmailValidate();
    }

    function shippingValidate() {
        shippingFirstNameValidate();
        shippingLastNameValidate();
        shippingAddressValidate();
        shippingCountryValidate();
        shippingProvinceValidate();
        shippingCityValidate();
        shippingPostalValidate();
        shippingPhoneValidate();
        shippingEmailValidate();
    }

    function validateCreditCard() {
        validateCreditCardNumber();
        validateCreditExpiry();
        validateCVC();
    }

    //functions to validate individual fields (all are the same unless commented otherwise)
    //first name
    function billingFirstNameValidate() {
        //getting values from input
        billingFirstName = $(`#billingFirstName`).val();
        //going through and checking if fields are either empty, or match the regex, and display feedback appropriately
        if (billingFirstName === ``) {
            $(`#billingFirstName`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
            $(`#billingFirstName`).siblings(`.invalid-feedback`).text(`Please enter your first name`);
            isBillingFormValid = false;
        }
        else if (billingFirstName.match(regFirstName)) {
            $(`#billingFirstName`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isBillingFormValid = true;
        }
        else {
            $(`#billingFirstName`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            $(`#billingFirstName`).siblings(`.invalid-feedback`).text(`Please enter a valid first name (No numbers or spaces)`)
            isBillingFormValid = false;
        }
    }

    //last name
    function billingLastNameValidate() {
        billingLastName = $(`#billingLastName`).val();
        if (billingLastName === ``) {
            $(`#billingLastName`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
            $(`#billingLastName`).siblings(`.invalid-feedback`).text(`Please enter your last name`);
            isBillingFormValid = false;
        }
        else if (billingLastName.match(regLastName)) {
            $(`#billingLastName`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isBillingFormValid = true;
        }
        else {
            $(`#billingLastName`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            $(`#billingLastName`).siblings(`.invalid-feedback`).text(`Please enter a valid last name (No numbers or spaces)`);
            isBillingFormValid = false;
        }
    }
    function billingAddressValidate() {
        billingAddress = $(`#billingAddress`).val();
        //address
        if (billingAddress === ``) {
            $(`#billingAddress`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            $(`#billingAddress`).siblings(`.invalid-feedback`).text(`Please enter your address`);
            isBillingFormValid = false;
        }
        else if (billingAddress.match(regAddress)) {
            $(`#billingAddress`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isBillingFormValid = true;
        }
        else {
            $(`#billingAddress`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            $(`#billingAddress`).siblings(`.invalid-feedback`).text(`Invalid address (1234 Main street...)`)
            isBillingFormValid = false;
        }
    }

    function billingSecondAddressValidate() {
        billingAddress2 = $(`#billingSecondAddress`).val();
        //address
        if (billingAddress2 === ``) {
            $(`#billingSecondAddress`).removeClass(`is-invalid`).removeClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isBillingFormValid = true;
        }
        else if (billingAddress2.match(regSecondAddress)) {
            $(`#billingSecondAddress`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isBillingFormValid = true;
        }
        else {
            $(`#billingSecondAddress`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
            $(`#billingSecondAddress`).siblings(`.invalid-feedback`).text(`Please enter a valid second address (Apt 123, Basement suite...)`);
            isBillingFormValid = false;
        }
    }

    //country
    function billingCountryValidate() {
        billingCountry = $(`#billingCountry`).val();
        billingPostalCode = $(`#billingZip`).val();
        if (billingCountry === null) {
            $(`#billingCountry`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            $(`#billingCountry`).siblings(`.invalid-feedback`).text(`Please select your country`);
            isBillingFormValid = false;
        }
        else if (billingCountry === `CAD` && billingPostalCode !== ``) { //to prevent message being displayed before user types a postal code in
            if (billingPostalCode.match(canRegPostal)) {
                $(`#billingCountry`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
                isBillingFormValid = true;
            } 
            else {
                $(`#billingCountry`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
                $(`#billingCountry`).siblings(`.invalid-feedback`).text(`Country/Postal mismatch`);
                isBillingFormValid = false;
            }
        }
        else if (billingCountry === 'USA' && billingPostalCode !== ``) {
            if (billingPostalCode.match(usaRegPostal)) {
                $(`#billingCountry`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
                isBillingFormValid = true;
            }
            else {
                $(`#billingCountry`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
                $(`#billingCountry`).siblings(`.invalid-feedback`).text(`Country/Zip mismatch`);
                isBillingFormValid = false;
            }
        }
    }

    //province
    function billingProvinceValidate() {
        billingProvince = $(`#billingProvince`).val();
        if (billingProvince === null) {
            if (billingCountry === `CAD`) {
                $(`#billingProvince`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
                $(`#billingProvince`).siblings(`.invalid-feedback`).text(`Please select a province`);
                isBillingFormValid = false;
            }
            else {
                $(`#billingProvince`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
                $(`#billingProvince`).siblings(`.invalid-feedback`).text(`Please select a state`);
                isBillingFormValid = false;
            }
        }
        else {
            $(`#billingProvince`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isBillingFormValid = true;
        }
    }

    //city
    function billingCityValidate() {
        billingCity = $(`#billingCity`).val();
        if (billingCity === ``) {
            $(`#billingCity`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
            $(`#billingCity`).siblings(`.invalid-feedback`).text(`Please enter your city`);
            isBillingFormValid = false;
        }
        else if (billingCity.match(regCity)) {
            $(`#billingCity`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isBillingFormValid = true;
        }
        else {
            $(`#billingCity`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            $(`#billingCity`).siblings(`.invalid-feedback`).text(`Please enter a valid city (Victoria, Los Angeles...)`);
            isBillingFormValid = false;
        }
    }

    //postal code
    function billingPostalValidate() {
        billingPostalCode = $(`#billingZip`).val();
        billingCountry = $(`#billingCountry`).val();
        if (billingCountry === `CAD`) { //checking which country was selected and displaying appropriate feedback
            if (billingPostalCode.match(canRegPostal)) {
                $(`#billingZip`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
                $(`#shippingCountry`).siblings(`.invalid-feedback`).text(`Please enter a valid postal code`);
                isBillingFormValid = true;
            } else {
                $(`#billingZip`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
                $(`#billingZip`).siblings(`.invalid-feedback`).text(`Please enter a valid postal code`);
                isBillingFormValid = false;
            }
            
        } else if (billingCountry === `USA`) {
            if (billingPostalCode.match(usaRegPostal)) {
                $(`#billingZip`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();  
                isBillingFormValid = true;            
            } else {
                $(`#billingZip`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
                $(`#billingZip`).siblings(`.invalid-feedback`).text(`Please enter a valid zip code`);
                isBillingForrmValid = false;
            }
        } else if (billingCountry === null) {
            $(`#billingZip`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            $(`#billingZip`).siblings(`.invalid-feedback`).text(`Please select a country`);
            isBillingFormValid = false;
        } else {
            $(`#billingZip`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            $(`#billingZip`).siblings(`.invalid-feedback`).text(`Please enter a valid zip code`);
            isBillingFormValid = false;
        }
    }

    //phone number
    function billingPhoneValidate() {
        billingPhone = $(`#billingPhone`).val();
        //phone
        if (billingPhone === ``) {
            $(`#billingPhone`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
            $(`#billingPhone`).siblings(`.invalid-feedback`).text(`Please enter your phone number`);
            isBillingFormValid = false;
        }
        else if (billingPhone.match(regPhone)) {
            $(`#billingPhone`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isBillingFormValid = true;
        }
        else {
            $(`#billingPhone`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            $(`#billingPhone`).siblings(`.invalid-feedback`).text(`Please enter a valid phone number (1-234-567-8964)`);
            isBillingFormValid = false;
        }
    }

    //email
    function billingEmailValidate() {
        billingEmail = $(`#billingEmail`).val();
        //email
        if (billingEmail === ``) {
            $(`#billingEmail`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
            $(`#billingEmail`).siblings(`.invalid-feedback`).text(`Please enter your email`);
            isBillingFormValid = false;
        }
        else if (billingEmail.match(regEmail)) {
            $(`#billingEmail`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isBillingFormValid = true;
        }
        else {
            $(`#billingEmail`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            $(`#billingEmail`).siblings(`.invalid-feedback`).text(`Please enter a valid email (someone@someone.com)`);
            isBillingFormValid = false;
        }
    }

    //shipping forms (exact same as billing, only thing different is variable names and the checkbox)
    //first name
    function shippingFirstNameValidate() {
        if (!$(`#sameInfo`).prop(`checked`)) { //this checks if the button is clicked, and if so it assigns the shipping variables to the billing variables
            shippingFirstName = $(`#shippingFirstName`).val();
        }
        else {
            shippingFirstName = $(`#billingFirstName`).val();
        }

        if (shippingFirstName === ``) {
            $(`#shippingFirstName`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
            $(`#shippingFirstName`).siblings(`.invalid-feedback`).text(`Please enter your first name`);
            isShippingFormValid = false;
        }
        else if (shippingFirstName.match(regFirstName)) {
            $(`#shippingFirstName`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isShippingFormValid = true;
        }
        else {
            $(`#shippingFirstName`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            $(`#shippingFirstName`).siblings(`.invalid-feedback`).text(`Please enter a valid first name (No numbers or spaces)`)
            isShippingFormValid = false;
        }
    }
    
    //first name
    function shippingLastNameValidate() {
        if (!$(`#sameInfo`).prop(`checked`)) { 
            shippingLastName = $(`#shippingLastName`).val();
        }
        else {
            shippingLastName = $(`#billingLastName`).val();
        }
        //last name
        if (shippingLastName === ``) {
            $(`#shippingLastName`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
            $(`#shippingLastName`).siblings(`.invalid-feedback`).text(`Please enter your last name`);
            isShippingFormValid = false;
        }
        else if (shippingLastName.match(regLastName)) {
            $(`#shippingLastName`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isShippingFormValid = true;
        }
        else {
            $(`#shippingLastName`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            $(`#shippingLastName`).siblings(`.invalid-feedback`).text(`Please enter a valid last name (No numbers or spaces)`);
            isShippingFormValid = false;
        }
    }

    //address
    function shippingAddressValidate() {
        if (!$(`#sameInfo`).prop(`checked`)) {
            shippingAddress = $(`#shippingAddress`).val();
        }
        else {
            shippingAddress = $(`#billingAddress`).val();
        }
        //address
        if (shippingAddress === ``) {
            $(`#shippingAddress`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
            $(`#shippingAddress`).siblings(`.invalid-feedback`).text(`Please enter your address`);
            isShippingFormValid = false;
        }
        else if (shippingAddress.match(regAddress)) {
            $(`#shippingAddress`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isShippingFormValid = true;
        }
        else {
            $(`#shippingAddress`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            $(`#shippingAddress`).siblings(`.invalid-feedback`).text(`Invalid address (1234 Main street...)`)
            isShippingFormValid = false;
        }
    }

    //second address (optional field)
    function shippingSecondAddressValidate() {
        if (!$(`#sameInfo`).prop(`checked`)) {
            shippingAddress2 = $(`#shippingSecondAddress`).val();
        }
        else {
            shippingAddress2 = $(`#shippingSecondAddress`).val();
        }

        if (shippingAddress2 === ``) {
            $(`#shippingSecondAddress`).removeClass(`is-invalid`).removeClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isShippingFormValid = true;
        }
        else if (shippingAddress2.match(regSecondAddress)) {
            $(`#shippingSecondAddress`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isShippingFormValid = true;
        }
        else {
            $(`#shippingSecondAddress`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
            $(`#shippingSecondAddress`).siblings(`.invalid-feedback`).text(`Please enter a valid second address (Apt 123, Basement suite...)`);
            isShuppingFormValid = false;
        }
    }

    //country
    function shippingCountryValidate() {
        if (!$(`#sameInfo`).prop(`checked`)) { //if the checkbox isnt selected, then get the values from the shipping form. elsewhere assigns the info from the billing form if it's clicked
            shippingCountry = $(`#shippingCountry`).val();
        }
        else {
            shippingCountry = $(`#billingCountry`).val();
        }
        
        shippingPostalCode = $(`#shippingZip`).val();
        if (shippingCountry === null) {
            $(`#shippingCountry`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            $(`#shippingCountry`).siblings(`.invalid-feedback`).text(`Please select your country`);
            isShippingFormValid = false;
        }
        else if (shippingCountry === `CAD` && shippingPostalCode !== ``) { //to prevent message being displayed before user types a postal code in
            if (shippingPostalCode.match(canRegPostal)) {
                $(`#shippingCountry`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
                isShippingFormValid = true;
            } 
            else {
                $(`#shippingCountry`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
                $(`#shippingCountry`).siblings(`.invalid-feedback`).text(`Country/Postal mismatch`);
                isShippingFormValid = false;
            }
        }
        else if (shippingCountry === 'USA' && shippingPostalCode !== ``) {
            if (shippingPostalCode.match(usaRegPostal)) {
                $(`#shippingCountry`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
                isShippingFormValid = true;
            }
            else {
                $(`#shippingCountry`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
                $(`#shippingCountry`).siblings(`.invalid-feedback`).text(`Country/Zip mismatch`);
                isShippingFormValid = false;
            }
        }
    }

    //province
    function shippingProvinceValidate() {
        shippingProvince = $(`#shippingProvince`).val();
        if (shippingProvince === null) {
            if (shippingProvince === `CAD`) {
                $(`#shippingProvince`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
                $(`#shippingProvince`).siblings(`.invalid-feedback`).text(`Please select a province`);
                isShippingFormValid = false;
            }
            else {
                $(`#shippingProvince`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
                $(`#shippingProvince`).siblings(`.invalid-feedback`).text(`Please select a state`);
                isShippingFormValid = false;
            }
        }
        else {
            $(`#shippingProvince`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isShippingFormValid = true;
        }
    }

    //postal cvode
    function shippingPostalValidate() {
        if (!$(`#sameInfo`).prop(`checked`)) {
            shippingPostalCode = $(`#shippingZip`).val();
        }
        else {
            shippingPostalCode = $(`#billingZip`).val();
        }
        shippingCountry = $(`#shippingCountry`).val();
        if (shippingCountry === `CAD`) { //checking which country was selected and displaying appropriate feedback
            if (shippingPostalCode.match(canRegPostal)) {
                $(`#shippingZip`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
                $(`#shippingCountry`).siblings(`.invalid-feedback`).text(`Please enter a valid postal code`);
                isShippingFormValid = true;
            } else {
                $(`#shippingZip`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
                $(`#shippingZip`).siblings(`.invalid-feedback`).text(`Please enter a valid postal code`);
                isShippingFormValid = false;
            }
            
        } else if (shippingCountry === `USA`) {
            if (shippingPostalCode.match(usaRegPostal)) {
                $(`#shippingZip`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();  
                isShippingFormValid = true;            
            } else {
                $(`#shippingZip`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
                $(`#shippingZip`).siblings(`.invalid-feedback`).text(`Please enter a valid zip code`);
                isShippingFormValid = false;
            }
        } else if (shippingCountry === null) {
            $(`#shippingZip`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            $(`#shippingZip`).siblings(`.invalid-feedback`).text(`Please select a country`);
            isShippingFormValid = false;
        } else {
            $(`#shippingZip`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            $(`#shippingZip`).siblings(`.invalid-feedback`).text(`Please enter a valid zip code`);
            isShippingFormValid = false;
        }
    }

    //city
    function shippingCityValidate() {
        if (!$(`#sameInfo`).prop(`checked`)) { //if the checkbox isnt selected, then get the values from the shipping form. elsewhere assigns the info from the billing form if it's clicked
            shippingCity = $(`#shippingCity`).val();
        }
        else {
            shippingCity = $(`#billingCity`).val();
        }

        //city
        if (shippingCity === ``) {
            $(`#shippingCity`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
            $(`#shippingCity`).siblings(`.invalid-feedback`).text(`Please enter your city`);
            isShippingFormValid = false;
        }
        else if (shippingCity.match(regCity)) {
            $(`#shippingCity`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isShippingFormValid = true;
        }
        else {
            $(`#shippingCity`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            $(`#shippingCity`).siblings(`.invalid-feedback`).text(`Please enter a valid city (Victoria, Los Angeles...)`)
            isShippingFormValid = false;
        }
    }

    //phone
    function shippingPhoneValidate() {
        if (!$(`#sameInfo`).prop(`checked`)) { //if the checkbox isnt selected, then get the values from the shipping form. elsewhere assigns the info from the billing form if it's clicked
            shippingPhone = $(`#shippingPhone`).val();
        }
        else {
            shippingPhone = $(`#billingPhone`).val();
        }
        //phone
        if (shippingPhone === ``) {
            $(`#shippingPhone`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
            $(`#shippingPhone`).siblings(`.invalid-feedback`).text(`Please enter your phone number`);
            isShippingFormValid = false;
        }
        else if (shippingPhone.match(regPhone)) {
            $(`#shippingPhone`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isShippingFormValid = true;
        }
        else {
            $(`#shippingZip`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            $(`#shippingPhone`).siblings(`.invalid-feedback`).text(`Please enter a valid phone number (1-234-567-8964)`);
            isShippingFormValid = false;
        }
    }

    //email    
    function shippingEmailValidate() {
        if (!$(`#sameInfo`).prop(`checked`)) { //if the checkbox isnt selected, then get the values from the shipping form. elsewhere assigns the info from the billing form if it's clicked
            shippingEmail = $(`#shippingEmail`).val();
        }
        else {
            shippingEmail = $(`#billingEmail`).val();
        }

        //email
        if (shippingEmail === ``) {
            $(`#shippingEmail`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
            $(`#shippingEmail`).siblings(`.invalid-feedback`).text(`Please enter your email`);
            isShippingFormValid = false;
        }
        else if (shippingEmail.match(regEmail)) {
            $(`#shippingEmail`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isShippingFormValid = true;
        }
        else {
            $(`#shippingEmail`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            $(`#shippingEmail`).siblings(`.invalid-feedback`).text(`Please enter a valid email (someone@someone.com)`);
            isShippingFormValid = false;
        }
    }

    //CREDIT CARD FORM
    //credit card
    function validateCreditCardNumber() {
        billingCcNumber = $(`#creditCardNumber`).val();
        if (billingCcNumber === ``) {
            $(`#creditCardNumber`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
            $(`#creditCardNumber`).siblings(`.invalid-feedback`).text(`Please enter your credit card number`);
            isCreditCardFormValid = false;
        }
        else if (billingCcNumber.match(ccRegex)) {
            $(`#creditCardNumber`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isCreditCardFormValid = true;
        }
        else {
            $(`#creditCardNumber`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            $(`#creditCardNumber`).siblings(`.invalid-feedback`).text(`Please enter a valid 16 digit credit card number`);
            isCreditCardFormValid = false;
        }
    }

    //card expiry
    function validateCreditExpiry() {
        billingCcMonth = $(`#expirationMonth`).val();
        billingCcYear = $(`#expirationYear`).val(); 
        const maxYear = currentYear + 10; // setting the max to 10 years ahead.
        if (!billingCcMonth || !billingCcYear) { // Check if both fields are filled in
            $(`#expirationMonth`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            $(`#expirationMonth`).siblings(`.invalid-feedback`).text(`Please enter a valid expiration date!`);
            $(`#expirationYear`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            $(`#expirationYear`).siblings(`.invalid-feedback`).text(`Please enter a valid expiration date!`);
            isCreditCardFormValid = false;
        }
        if (billingCcYear < currentYear) { // Check if the year is in the past
            $(`#expirationMonth`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            $(`#expirationMonth`).siblings(`.invalid-feedback`).text(`Cannot be in the past!`);
            $(`#expirationYear`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            $(`#expirationYear`).siblings(`.invalid-feedback`).text(`Please enter a valid expiration date!`);
            isCreditCardFormValid = false;
        } else if (billingCcYear > maxYear) { // Check if the year is too far ahead
            $(`#expirationMonth`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            $(`#expirationMonth`).siblings(`.invalid-feedback`).text(`Too far ahead!`);
            $(`#expirationYear`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            $(`#expirationYear`).siblings(`.invalid-feedback`).text(`Please enter a valid expiration date!`);
            isCreditCardFormValid = false;
        } else if (billingCcYear === currentYear && billingCcMonth < currentMonth) { // Check if the year is current and the month is in the past
            $(`#expirationMonth`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            $(`#expirationMonth`).siblings(`.invalid-feedback`).text(`Cannot be in the past!`);
            $(`#expirationYear`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            $(`#expirationYear`).siblings(`.invalid-feedback`).text(`Please enter a valid expiration date!`);
            isCreditCardFormValid = false;
        } else if (billingCcMonth.match(monthRegex) && billingCcYear.match(yearRegex)) { // All validations pass
            $(`#expirationMonth`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            $(`#expirationYear`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isCreditCardFormValid = true;
        }
        if (!billingCcMonth.match(monthRegex)) {
            $(`#expirationMonth`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            $(`#expirationMonth`).siblings(`.invalid-feedback`).text(`Please enter a valid expiration date!`);
            isCreditCardFormValid = false;
        }
        if (!billingCcYear.match(yearRegex)) {
            $(`#expirationYear`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            $(`#expirationYear`).siblings(`.invalid-feedback`).text(`Please enter a valid expiration date!`);
            isCreditCardFormValid = false;
        }
    }

    //cvc
    function validateCVC() {
        billingCvc = $(`#cvcNumber`).val();
        if (billingCvc.match(cvcRegex)) {
            $(`#cvcNumber`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isCreditCardFormValid = true;
        }
        else {
            $(`#cvcNumber`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            $(`#cvcNumber`).siblings(`.invalid-feedback`).text(`Please enter a valid 3 digit CVC number`);
            isCreditCardFormValid = false;
        }
    }

    //focusout function calls for each input field
    $(`#billingFirstName`).on(`focusout`, function() {
        billingFirstNameValidate();
    });

    //last name
    $(`#billingLastName`).on(`focusout`, function() { //billing last name
        billingLastNameValidate();
    });

    //address
    $(`#billingAddress`).on(`focusout`, function() {
        billingAddressValidate();
    });

    //second address
    $(`#billingSecondAddress`).on(`focusout`, function() {
        billingSecondAddressValidate();
    });

    //city
    $(`#billingCity`).on(`focusout`, function() {
        billingCityValidate();
    });

    //phone
    $(`#billingPhone`).on(`focusout`, function() {
        billingPhoneValidate();
    });

    //email
    $(`#billingEmail`).on(`focusout`, function() {
        billingEmailValidate(); 
    });

    //country
    $(`#shippingProvince`).on(`input`, function() {
        shippingProvinceValidate();
    });

    //province
    $(`#billingProvince`).on(`input`, function() {
        billingProvinceValidate();
    });

    //country
    $('#billingCountry').on('change', function() {
        billingCountryValidate();
        billingProvince = $(`#billingZip`).val()
            if (billingProvince !== ``) {
                billingPostalValidate(); // validate the postal code if it isn't empty
            } 
        
        if (billingCountry === `CAD`) { //display appropriate options based on country selected
            $(`#billingZip`).attr(`placeholder`, `A1A 1A1`);
            $(`#billingProvince`).empty().append(`
                <option selected disabled>Select Province</option>
                <option value="AB">Alberta</option>
                <option value="BC">British Columbia</option>
                <option value="MB">Manitoba</option>
                <option value="NB">New Brunswick</option>
                <option value="NL">Newfoundland and Labrador</option>
                <option value="NS">Nova Scotia</option>
                <option value="NT">Northwest Territories</option>
                <option value="NU">Nunavut</option>
                <option value="ON">Ontario</option>
                <option value="PE">Prince Edward Island</option>
                <option value="QC">Quebec</option>
                <option value="SK">Saskatchewan</option>
                <option value="YT">Yukon</option>
            `);
        }
        else {
            $(`#billingZip`).attr(`placeholder`, `12345`);
            $(`#billingProvince`).empty().append(`
                <option selected disabled>Select State</option>
                <option value="AK">Alaska</option>
                <option value="AL">Alabama</option>
                <option value="AR">Arkansas</option>
                <option value="AZ">Arizona</option>
                <option value="CA">California</option>
                <option value="CO">Colorado</option>
                <option value="CT">Connecticut</option>
                <option value="DC">District of Columbia</option>
                <option value="DE">Delaware</option>
                <option value="FL">Florida</option>
                <option value="GA">Georgia</option>
                <option value="HI">Hawaii</option>
                <option value="IA">Iowa</option>
                <option value="ID">Idaho</option>
                <option value="IL">Illinois</option>
                <option value="IN">Indiana</option>
                <option value="KS">Kansas</option>
                <option value="KY">Kentucky</option>
                <option value="LA">Louisiana</option>
                <option value="MA">Massachusetts</option>
                <option value="MD">Maryland</option>
                <option value="ME">Maine</option>
                <option value="MI">Michigan</option>
                <option value="MN">Minnesota</option>
                <option value="MO">Missouri</option>
                <option value="MS">Mississippi</option>
                <option value="MT">Montana</option>
                <option value="NC">North Carolina</option>
                <option value="ND">North Dakota</option>
                <option value="NE">Nebraska</option>
                <option value="NH">New Hampshire</option>
                <option value="NJ">New Jersey</option>
                <option value="NM">New Mexico</option>
                <option value="NV">Nevada</option>
                <option value="NY">New York</option>
                <option value="OH">Ohio</option>
                <option value="OK">Oklahoma</option>
                <option value="OR">Oregon</option>
                <option value="PA">Pennsylvania</option>
                <option value="PR">Puerto Rico</option>
                <option value="RI">Rhode Island</option>
                <option value="SC">South Carolina</option>
                <option value="SD">South Dakota</option>
                <option value="TN">Tennessee</option>
                <option value="TX">Texas</option>
                <option value="UT">Utah</option>
                <option value="VA">Virginia</option>
                <option value="VT">Vermont</option>
                <option value="WA">Washington</option>
                <option value="WI">Wisconsin</option>
                <option value="WV">West Virginia</option>
                <option value="WY">Wyoming</option>
            `);
        }
    });

    //postal/zip
    $(`#billingZip`).on(`focusout`, function() {
        billingPostalValidate();
        billingCountryValidate(); //to make sure both feedback messages get displayed correctly
    });
    
    // SHIPPING (same as billing, nothing different here except variable names)
    //first name
    $(`#shippingFirstName`).on(`focusout`, function() { 
        shippingFirstNameValidate();
    });

    //last name
    $(`#shippingLastName`).on(`focusout`, function() { //billing last name
        shippingLastNameValidate();
    });

    //address
    $(`#shippingAddress`).on(`focusout`, function() {
        shippingAddressValidate();
    });

    //second address
    $(`#shippingSecondAddress`).on(`focusout`, function() {
        shippingSecondAddressValidate();
    });

    //city
    $(`#shippingCity`).on(`focusout`, function() {
        shippingCityValidate();
    });

    //phone
    $(`#shippingPhone`).on(`focusout`, function() {
        shippingPhoneValidate();
    });

    //email
    $(`#shippingEmail`).on(`focusout`, function() {
        shippingEmailValidate();
    });

    //country
    $('#shippingCountry').on('change', function() {
        shippingCountryValidate();
        shippingProvince = $(`#shippingZip`).val();
        if (shippingProvince !== ``) {
            shippingPostalValidate();
        }
        if (shippingCountry === `CAD`) { //display appropriate options based on country selected
            $(`#shippingZip`).attr(`placeholder`, `A1A 1A1`);
            $(`#shippingProvince`).empty().append(`
                <option selected disabled>Select Province</option>
                <option value="AB">Alberta</option>
                <option value="BC">British Columbia</option>
                <option value="MB">Manitoba</option>
                <option value="NB">New Brunswick</option>
                <option value="NL">Newfoundland and Labrador</option>
                <option value="NS">Nova Scotia</option>
                <option value="NT">Northwest Territories</option>
                <option value="NU">Nunavut</option>
                <option value="ON">Ontario</option>
                <option value="PE">Prince Edward Island</option>
                <option value="QC">Quebec</option>
                <option value="SK">Saskatchewan</option>
                <option value="YT">Yukon</option>
            `);
        }
        else {
            $(`#shippingZip`).attr(`placeholder`, `12345`);
            $(`#shippingProvince`).empty().append(`
                <option selected disabled>Select State</option>
                <option value="AK">Alaska</option>
                <option value="AL">Alabama</option>
                <option value="AR">Arkansas</option>
                <option value="AZ">Arizona</option>
                <option value="CA">California</option>
                <option value="CO">Colorado</option>
                <option value="CT">Connecticut</option>
                <option value="DC">District of Columbia</option>
                <option value="DE">Delaware</option>
                <option value="FL">Florida</option>
                <option value="GA">Georgia</option>
                <option value="HI">Hawaii</option>
                <option value="IA">Iowa</option>
                <option value="ID">Idaho</option>
                <option value="IL">Illinois</option>
                <option value="IN">Indiana</option>
                <option value="KS">Kansas</option>
                <option value="KY">Kentucky</option>
                <option value="LA">Louisiana</option>
                <option value="MA">Massachusetts</option>
                <option value="MD">Maryland</option>
                <option value="ME">Maine</option>
                <option value="MI">Michigan</option>
                <option value="MN">Minnesota</option>
                <option value="MO">Missouri</option>
                <option value="MS">Mississippi</option>
                <option value="MT">Montana</option>
                <option value="NC">North Carolina</option>
                <option value="ND">North Dakota</option>
                <option value="NE">Nebraska</option>
                <option value="NH">New Hampshire</option>
                <option value="NJ">New Jersey</option>
                <option value="NM">New Mexico</option>
                <option value="NV">Nevada</option>
                <option value="NY">New York</option>
                <option value="OH">Ohio</option>
                <option value="OK">Oklahoma</option>
                <option value="OR">Oregon</option>
                <option value="PA">Pennsylvania</option>
                <option value="PR">Puerto Rico</option>
                <option value="RI">Rhode Island</option>
                <option value="SC">South Carolina</option>
                <option value="SD">South Dakota</option>
                <option value="TN">Tennessee</option>
                <option value="TX">Texas</option>
                <option value="UT">Utah</option>
                <option value="VA">Virginia</option>
                <option value="VT">Vermont</option>
                <option value="WA">Washington</option>
                <option value="WI">Wisconsin</option>
                <option value="WV">West Virginia</option>
                <option value="WY">Wyoming</option>
            `);
        }
       
    });    
    $(`#shippingZip`).on(`focusout`, function() {
        shippingPostalValidate();
        shippingCountryValidate();
    });

    //credit card form
    $(`#creditCardNumber`).on(`focusout`, function() {
        validateCreditCardNumber();
    });
      
    $(`#expirationYear`).on(`focusout`, function() {
        validateCreditExpiry();
    });

    $(`#cvcNumber`).on(`focusout`, function() {
        validateCVC();
    });

    //logic for tabs for checkout modal
    $(`#pills-payment-tab`).click(function() {
        $(`#submitOrderBtn`).hide();
        $(`#continueBtn`).show();
        $(`#backBtn`).show();
    });

    $(`#pills-shipping-tab`).click(function() {
        $(`#submitOrderBtn`).hide();
        $(`#continueBtn`).show();
        $(`#backBtn`).show();
    });

    $(`#pills-billing-tab`).click(function() {
        $(`#submitOrderBtn`).hide();
        $(`#continueBtn`).show();
        $(`#backBtn`).hide();
    });

    $(`#pills-confirmation-tab`).click(function() {
        $(`#submitOrderBtn`).show();
        $(`#continueBtn`).hide();
        $(`#backBtn`).show();
    });
});
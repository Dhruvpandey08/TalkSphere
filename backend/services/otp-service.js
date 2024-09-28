const crypto = require('crypto');
require('dotenv').config();
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

var sms_id = process.env.TWILIO_ACCOUNT_SID;
var auth_token = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(sms_id, auth_token);

class OtpService {
    async generateOtp() {
        const otp = crypto.randomInt(1000, 9999);
        return otp;
    }

    async sendBySms(phone, otp) {
        // Use Twilio Verify Service to send OTP
        return await client.verify.v2.services(process.env.TWILIO_SERVICE_ID)
            .verifications
            .create({
                channel: 'sms',
                to: phone
            });
    }

    async verifyOtp(otp, phone) {
        // Ensure the phone number is in E.164 format
        if (!phone.startsWith('+91')) {
            phone = `+91${phone.replace(/\s+/g, '')}`;  // Remove any spaces if present
        }
    
        try {
            // Verify the OTP
            const verificationCheck = await client.verify.v2.services(process.env.TWILIO_SERVICE_ID)
                .verificationChecks.create({
                    to: phone, // Ensure 'to' is first, followed by 'code'
                    code: otp,
                });
            console.log(verificationCheck.status);
            
            return verificationCheck.status === 'approved'; // Return whether the OTP was successfully verified
        } catch (error) {
            console.error('Error verifying OTP:', error);
            return false; // Return false in case of an error
        }
    }

    
}

module.exports = new OtpService();

const otpService = require("../services/otp-service");
const hashService = require("../services/hash-service");
const userService = require("../services/user-service");
const tokenService = require("../services/token-service");
const UserDto = require("../dtos/user-dto");

class AuthController {
  async sendOtp(req, res) {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ message: "Phone field is required!" });
    }

    // Format phone number to E.164 format for India
    const formattedPhone = `+91${phone}`; // India country code is +91

    // Log the formatted phone number for debugging
    console.log(`Sending OTP to: ${formattedPhone}`);

    const otp = await otpService.generateOtp();
    const ttl = 1000 * 60 * 2; // 2 min
    const expires = Date.now() + ttl;
    const data = `${formattedPhone}.${otp}.${expires}`;
    const hash = hashService.hashOtp(data);

    // Send OTP using Twilio (Updated to v2.services)
    try {
      await otpService.sendBySms(formattedPhone, otp);
      res.json({
        hash: `${hash}.${expires}`,
        phone: formattedPhone,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Message sending failed" });
    }
  }

  async verifyOtp(req, res) {
    const { otp, hash, phone } = req.body;

    console.log("Verifying OTP...");
    console.log("OTP entered:", otp);
    console.log("Phone:", phone);
    console.log("Hash:", hash);
    
    if (!otp || !hash || !phone) {
        return res.status(400).json({ message: 'All fields are required!' });
    }

    const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;

    const [hashedOtp, expires] = hash.split(".");
    if (Date.now() > +expires) {
        return res.status(400).json({ message: 'OTP expired!' });
    }

    const data = `${formattedPhone}.${otp}.${expires}`;
    const isValid = otpService.verifyOtp(otp, phone);
    if (!isValid) {
        return res.status(400).json({ message: 'Invalid OTP' });
    }

    let user;
    try {
        user = await userService.findUser({ phone });
        if (!user) {
            // Create user if not found
            user = await userService.createUser({ phone });
            console.log('Created User:', user);
        }
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Database error' });
    }

    // Generate tokens and set cookies
    const { accessToken, refreshToken } = tokenService.generateTokens({
        _id: user._id,
        activated: user.activated,
    });

    await tokenService.storeRefreshToken(refreshToken, user._id);

    res.cookie('refreshToken', refreshToken, {
        maxAge: 1000 * 60 * 60 * 24 * 30,
        httpOnly: true,
    });

    res.cookie('accessToken', accessToken, {
        maxAge: 1000 * 60 * 60 * 24 * 30,
        httpOnly: true,
    });

    const userDto = new UserDto(user);
    res.json({ user: userDto, auth: true });
  }

  async refresh(req, res) {
    const { refreshToken: refreshTokenFromCookie } = req.cookies;

    try {
      const userData = await tokenService.verifyRefreshToken(
        refreshTokenFromCookie
      );
      const token = await tokenService.findRefreshToken(
        userData._id,
        refreshTokenFromCookie
      );
      if (!token) return res.status(401).json({ message: "Invalid token" });

      const user = await userService.findUser({ _id: userData._id });
      if (!user) return res.status(404).json({ message: "No user" });

      const { refreshToken, accessToken } = tokenService.generateTokens({
        _id: userData._id,
      });
      await tokenService.updateRefreshToken(userData._id, refreshToken);

      this.setAuthCookies(res, refreshToken, accessToken);

      const userDto = new UserDto(user);
      res.json({ user: userDto, auth: true });
    } catch (err) {
      return res.status(500).json({ message: "Internal error" });
    }
  }

  async logout(req, res) {
    // If you don't want to track logout, you can remove token-related logic
    res.clearCookie("refreshToken");
    res.clearCookie("accessToken");
    res.json({ message: 'Logged out successfully' });
}


  setAuthCookies(res, refreshToken, accessToken) {
    const maxAge = 1000 * 60 * 60 * 24 * 30; // 30 days
    res.cookie("refreshToken", refreshToken, { maxAge, httpOnly: true });
    res.cookie("accessToken", accessToken, { maxAge, httpOnly: true });
  }
}

module.exports = new AuthController();

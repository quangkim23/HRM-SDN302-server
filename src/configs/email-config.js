const nodemailer = require("nodemailer");
const CustomError = require("../core/custom-error");
const ErrorTypes = require("../constants/error-type");
const ErrorMessages = require("../constants/error-message");

const emailConfig = {
  createTransporter: () => {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  },

  /**
   * Hàm gửi email chung cho toàn bộ ứng dụng
   * @param {Object} options - Các tùy chọn email
   * @param {string} options.to - Địa chỉ email người nhận
   * @param {string} options.subject - Tiêu đề email
   * @param {string} options.html - Nội dung HTML của email
   * @param {string} [options.from] - Người gửi (tùy chọn)
   * @param {Array<Object>} [options.attachments] - Tệp đính kèm (tùy chọn)
   * @param {string} [options.text] - Nội dung văn bản thường (tùy chọn)
   * @param {string} [options.cc] - CC (tùy chọn)
   * @param {string} [options.bcc] - BCC (tùy chọn)
   * @returns {Promise<Object>} - Thông tin kết quả gửi email
   */
  sendMail: async (options) => {
    const transporter = emailConfig.createTransporter();

    const { to, subject, html, from, attachments, text, cc, bcc } = options;

    // Kiểm tra các trường bắt buộc
    if (!to || !subject || !html) {
      throw new CustomError(
        ErrorTypes.MissingInputSendMail,
        ErrorMessages.MissingInputSendMail
      );
    }

    // Cấu hình email
    const mailOptions = {
      from:
        from ||
        `"${process.env.EMAIL_NAME || "Human Resource Management"}" <${
          process.env.EMAIL_USER
        }>`,
      to: to,
      subject: subject,
      html: html,
      ...(text && { text }), // Thêm text nếu có
      ...(cc && { cc }), // Thêm cc nếu có
      ...(bcc && { bcc }), // Thêm bcc nếu có
      ...(attachments && { attachments }), // Thêm tệp đính kèm nếu có
    };

    // Gửi email
    const info = await transporter.sendMail(mailOptions);

    console.log(`Email send: ${info.messageId}`);
    return {
      success: true,
      messageId: info.messageId,
      info: info,
    };
  },
};

module.exports = emailConfig;

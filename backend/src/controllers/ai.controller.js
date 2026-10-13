const aiService = require('../services/ai.service');

class AiController {
  async ask(req, res, next) {
    try {
      const { question } = req.body;
      const user = req.user;
      const ip = req.ip || req.connection?.remoteAddress;

      const result = await aiService.askQuestion(question, user, ip);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AiController();

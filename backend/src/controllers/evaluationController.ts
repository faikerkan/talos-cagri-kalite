import { Request, Response } from 'express';
import { Evaluation } from '../models/Evaluation';
import { Call } from '../models/Call';
import { EvaluationCriteria } from '../models/EvaluationCriteria';
import { User } from '../models/User';
import mongoose from 'mongoose';
import { ErrorResponse } from '../middleware/errorHandler';
import { validateRequest } from '../middleware/errorHandler';
import { evaluationValidationRules } from '../middleware/validator';
import logger from '../utils/logger';
import ExcelJS from 'exceljs';

// Yeni değerlendirme oluşturma
export const createEvaluation = async (req: Request, res: Response, next: Function) => {
  try {
    const { call, evaluator, total_score, notes, details } = req.body;
    
    // Çağrıyı kontrol et
    const callExists = await Call.findById(call);
    if (!callExists) {
      return next(new ErrorResponse('Belirtilen çağrı bulunamadı', 404));
    }
    
    // Değerlendirici kontrolü
    if (evaluator !== req.user?.id && req.user?.role !== 'manager') {
      return next(new ErrorResponse('Başka bir kullanıcı adına değerlendirme yapamazsınız', 403));
    }
    
    // Çağrı zaten değerlendirilmiş mi?
    const existingEvaluation = await Evaluation.findOne({ call });
    if (existingEvaluation) {
      return next(new ErrorResponse('Bu çağrı zaten değerlendirilmiş', 400));
    }
    
    // Yeni değerlendirme oluştur
    const evaluation = new Evaluation({
      call,
      evaluator,
      total_score,
      notes,
      details,
      evaluation_date: new Date()
    });
    
    // Kaydet
    await evaluation.save();
    
    // Çağrı durumunu güncelle
    await Call.findByIdAndUpdate(call, { status: 'evaluated' });
    
    // Düşük puan bildirimi kontrolü
    if (total_score < 70) {
      await checkLowScore(evaluation);
    }
    
    res.status(201).json({
      success: true,
      data: evaluation
    });
  } catch (error) {
    logger.error('Değerlendirme oluşturma hatası:', error);
    next(error);
  }
};

// Değerlendirmeyi çağrı ID'sine göre getir
export const getEvaluationByCallId = async (req: Request, res: Response, next: Function) => {
  try {
    const { callId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(callId)) {
      return next(new ErrorResponse('Geçersiz çağrı ID formatı', 400));
    }
    
    const evaluation = await Evaluation.findOne({ call: callId })
      .populate('evaluator', 'full_name email')
      .populate('call')
      .populate('details.criteria_id');
    
    if (!evaluation) {
      return next(new ErrorResponse('Değerlendirme bulunamadı', 404));
    }
    
    res.status(200).json({
      success: true,
      data: evaluation
    });
  } catch (error) {
    logger.error('Değerlendirme getirme hatası:', error);
    next(error);
  }
};

// Kullanıcının değerlendirmelerini getirme
export const getMyEvaluations = async (req: Request, res: Response, next: Function) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!userId) {
      return next(new ErrorResponse('Kullanıcı bilgisi bulunamadı', 401));
    }
    
    let evaluations;
    
    if (userRole === 'agent') {
      // Müşteri temsilcisinin değerlendirmelerini getir
      evaluations = await Evaluation.getAgentEvaluations(userId);
    } else if (userRole === 'quality_expert' || userRole === 'manager') {
      // Kalite uzmanının yaptığı değerlendirmeleri getir
      evaluations = await Evaluation.getEvaluationsByEvaluator(userId);
    } else {
      return next(new ErrorResponse('Bu işlem için yetkiniz yok', 403));
    }
    
    res.status(200).json({
      success: true,
      count: evaluations.length,
      data: evaluations
    });
  } catch (error) {
    logger.error('Değerlendirme getirme hatası:', error);
    next(error);
  }
};

// Değerlendirmeleri değerlendiriciye göre getirme
export const getEvaluationsByEvaluator = async (req: Request, res: Response, next: Function) => {
  try {
    const { evaluatorId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(evaluatorId)) {
      return next(new ErrorResponse('Geçersiz değerlendirici ID formatı', 400));
    }
    
    // Değerlendirici var mı kontrol et
    const evaluator = await User.findById(evaluatorId);
    if (!evaluator) {
      return next(new ErrorResponse('Belirtilen değerlendirici bulunamadı', 404));
    }
    
    // Manager değilse, sadece kendi değerlendirmelerini görebilir
    if (req.user?.role !== 'manager' && req.user?.id !== evaluatorId) {
      return next(new ErrorResponse('Başka bir kullanıcının değerlendirmelerini görme yetkiniz yok', 403));
    }
    
    const evaluations = await Evaluation.find({ evaluator: evaluatorId })
      .populate('call')
      .populate('evaluator', 'full_name email')
      .sort({ evaluation_date: -1 });
    
    res.status(200).json({
      success: true,
      count: evaluations.length,
      data: evaluations
    });
  } catch (error) {
    logger.error('Değerlendirme getirme hatası:', error);
    next(error);
  }
};

// Değerlendirmeleri çağrı görevlisine göre getirme
export const getEvaluationsByAgent = async (req: Request, res: Response, next: Function) => {
  try {
    const { agentId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(agentId)) {
      return next(new ErrorResponse('Geçersiz çağrı görevlisi ID formatı', 400));
    }
    
    // Çağrı görevlisi var mı kontrol et
    const agent = await User.findById(agentId);
    if (!agent) {
      return next(new ErrorResponse('Belirtilen çağrı görevlisi bulunamadı', 404));
    }
    
    // Agent rolündeki kullanıcı sadece kendi değerlendirmelerini görebilir
    if (req.user?.role === 'agent' && req.user.id !== agentId) {
      return next(new ErrorResponse('Başka bir çağrı görevlisinin değerlendirmelerini görme yetkiniz yok', 403));
    }
    
    const evaluations = await Evaluation.getAgentEvaluations(agentId);
    
    res.status(200).json({
      success: true,
      count: evaluations.length,
      data: evaluations
    });
  } catch (error) {
    logger.error('Değerlendirme getirme hatası:', error);
    next(error);
  }
};

// Değerlendirme istatistiklerini getirme
export const getEvaluationStats = async (req: Request, res: Response, next: Function) => {
  try {
    const { startDate, endDate, agentId, evaluatorId, minScore, maxScore } = req.query;
    
    // Filtre objesi oluştur
    const filter: any = {};
    
    // Tarih filtresini ekle
    if (startDate || endDate) {
      filter.evaluation_date = {};
      if (startDate) {
        filter.evaluation_date.$gte = new Date(startDate as string);
      }
      if (endDate) {
        filter.evaluation_date.$lte = new Date(endDate as string);
      }
    }
    
    // Puan filtresini ekle
    if (minScore || maxScore) {
      filter.total_score = {};
      if (minScore) {
        filter.total_score.$gte = parseInt(minScore as string);
      }
      if (maxScore) {
        filter.total_score.$lte = parseInt(maxScore as string);
      }
    }
    
    // Çağrı görevlisi filtresi için aggregate pipeline oluştur
    const pipeline = [];
    
    // Ana sorgu
    pipeline.push({ $match: filter });
    
    // Çağrı ile join
    pipeline.push({
      $lookup: {
        from: 'calls',
        localField: 'call',
        foreignField: '_id',
        as: 'callData'
      }
    });
    
    pipeline.push({ $unwind: '$callData' });
    
    // Çağrı görevlisi filtresi
    if (agentId && mongoose.Types.ObjectId.isValid(agentId as string)) {
      pipeline.push({
        $match: {
          'callData.agent': new mongoose.Types.ObjectId(agentId as string)
        }
      });
    }
    
    // Değerlendirici filtresi
    if (evaluatorId && mongoose.Types.ObjectId.isValid(evaluatorId as string)) {
      pipeline.push({
        $match: {
          evaluator: new mongoose.Types.ObjectId(evaluatorId as string)
        }
      });
    }
    
    // İstatistik hesaplama
    pipeline.push({
      $group: {
        _id: null,
        count: { $sum: 1 },
        averageScore: { $avg: '$total_score' },
        minScore: { $min: '$total_score' },
        maxScore: { $max: '$total_score' },
        evaluations: { $push: '$$ROOT' }
      }
    });
    
    // İstatistikleri al
    const stats = await Evaluation.aggregate(pipeline);
    
    const result = stats.length > 0 ? {
      count: stats[0].count,
      averageScore: parseFloat(stats[0].averageScore.toFixed(2)),
      minScore: stats[0].minScore,
      maxScore: stats[0].maxScore,
      evaluations: stats[0].evaluations.slice(0, 100) // Performans için ilk 100 değerlendirmeyi gönder
    } : {
      count: 0,
      averageScore: 0,
      minScore: 0,
      maxScore: 0,
      evaluations: []
    };
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Değerlendirme istatistikleri hatası:', error);
    next(error);
  }
};

// Değerlendirme istatistiklerini Excel olarak dışa aktarma
export const exportEvaluationStats = async (req: Request, res: Response, next: Function) => {
  try {
    const { startDate, endDate, agentId, evaluatorId, minScore, maxScore } = req.query;
    
    // Filtre objesi oluştur
    const filter: any = {};
    
    // Tarih filtresini ekle
    if (startDate || endDate) {
      filter.evaluation_date = {};
      if (startDate) {
        filter.evaluation_date.$gte = new Date(startDate as string);
      }
      if (endDate) {
        filter.evaluation_date.$lte = new Date(endDate as string);
      }
    }
    
    // Puan filtresini ekle
    if (minScore || maxScore) {
      filter.total_score = {};
      if (minScore) {
        filter.total_score.$gte = parseInt(minScore as string);
      }
      if (maxScore) {
        filter.total_score.$lte = parseInt(maxScore as string);
      }
    }
    
    // Değerlendirmeleri getir
    let query = Evaluation.find(filter)
      .populate('evaluator', 'full_name email')
      .populate({
        path: 'call',
        populate: {
          path: 'agent',
          select: 'full_name'
        }
      })
      .sort('-evaluation_date');
    
    // Değerlendirici filtresi
    if (evaluatorId && mongoose.Types.ObjectId.isValid(evaluatorId as string)) {
      query = query.find({ evaluator: evaluatorId });
    }
    
    const evaluations = await query.exec();
    
    // Excel dosyasını oluştur
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Değerlendirmeler');
    
    // Sütun başlıklarını tanımla
    worksheet.columns = [
      { header: 'Değerlendirme Tarihi', key: 'date', width: 20 },
      { header: 'Çağrı Görevlisi', key: 'agent', width: 25 },
      { header: 'Değerlendirici', key: 'evaluator', width: 25 },
      { header: 'Toplam Puan', key: 'score', width: 15 },
      { header: 'Notlar', key: 'notes', width: 40 }
    ];
    
    // Verileri ekle
    evaluations.forEach(eval => {
      worksheet.addRow({
        date: eval.evaluation_date.toLocaleDateString('tr-TR'),
        agent: eval.call?.agent?.full_name || 'Bilinmiyor',
        evaluator: eval.evaluator?.full_name || 'Bilinmiyor',
        score: eval.total_score,
        notes: eval.notes || ''
      });
    });
    
    // Başlık satırını formatla
    worksheet.getRow(1).font = { bold: true };
    
    // Excel dosyasını oluştur
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=degerlendirmeler.xlsx');
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    logger.error('Excel dışa aktarma hatası:', error);
    next(error);
  }
};

// Düşük puanlı değerlendirmeler için bildirim kontrol fonksiyonu
const checkLowScore = async (evaluation: any) => {
  try {
    if (evaluation.total_score < 70) {
      // Bildirim mantığı burada uygulanır
      logger.info(`Düşük puanlı değerlendirme bildirimi - Puan: ${evaluation.total_score}, Değerlendirme ID: ${evaluation._id}`);
    }
  } catch (error) {
    logger.error('Düşük puan bildirimi hatası:', error);
  }
}; 
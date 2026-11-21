const D = {
  uz: {
    pending: 'Tasdiqlanishi kutilmoqda',
    pendingNote: 'Kartangiz maktab ma’muriyati tasdiqlagandan keyin saytda hammaga ko‘rinadi.',
    profPending: 'Kartangiz tasdiqlanishini kutmoqda.',
    'sch.nav': 'Jadval',
    'sch.h': 'Dars jadvali',
    'sch.lead': 'Sinfni tanlang yoki o‘qituvchi bo‘yicha qidiring. Jadval faqat ro‘yxatdan o‘tgan foydalanuvchilarga ko‘rinadi.',
    'sch.none': 'Dars jadvali hali kiritilmagan.',
    'sch.time': 'Vaqt',
    'sch.mCls': 'Sinflar bo‘yicha',
    'sch.mTch': 'O‘qituvchilar bo‘yicha',
    'sch.grade': 'Sinf',
    'sch.tph': 'O‘qituvchi familiyasini yozing yoki tanlang…',
    'sch.print': 'Chop etish',
    'sch.now': 'Hozir',
    'sch.tnone': 'Bu o‘qituvchi uchun dars topilmadi.',
    'sch.pick': 'Yuqoridagi maydondan o‘qituvchini tanlang.',
    d0: 'Dushanba', d1: 'Seshanba', d2: 'Chorshanba', d3: 'Payshanba', d4: 'Juma', d5: 'Shanba',
    s0: 'Du', s1: 'Se', s2: 'Ch', s3: 'Pa', s4: 'Ju', s5: 'Sh'
  },
  ru: {
    pending: 'Ожидает подтверждения',
    pendingNote: 'Ваша карточка станет видна всем на сайте после подтверждения администрацией школы.',
    profPending: 'Ваша карточка ожидает подтверждения.',
    'sch.nav': 'Расписание',
    'sch.h': 'Расписание уроков',
    'sch.lead': 'Выберите класс или найдите по учителю. Расписание доступно только зарегистрированным пользователям.',
    'sch.none': 'Расписание ещё не добавлено.',
    'sch.time': 'Время',
    'sch.mCls': 'По классам',
    'sch.mTch': 'По учителям',
    'sch.grade': 'Класс',
    'sch.tph': 'Введите или выберите фамилию учителя…',
    'sch.print': 'Печать',
    'sch.now': 'Сейчас',
    'sch.tnone': 'Для этого учителя уроков не найдено.',
    'sch.pick': 'Выберите учителя в поле выше.',
    d0: 'Понедельник', d1: 'Вторник', d2: 'Среда', d3: 'Четверг', d4: 'Пятница', d5: 'Суббота',
    s0: 'Пн', s1: 'Вт', s2: 'Ср', s3: 'Чт', s4: 'Пт', s5: 'Сб'
  },
  en: {
    pending: 'Awaiting approval',
    pendingNote: 'Your card will be visible to everyone on the site once the school administration approves it.',
    profPending: 'Your card is awaiting approval.',
    'sch.nav': 'Timetable',
    'sch.h': 'Class timetable',
    'sch.lead': 'Choose a class or search by teacher. The timetable is visible only to registered users.',
    'sch.none': 'The timetable has not been added yet.',
    'sch.time': 'Time',
    'sch.mCls': 'By class',
    'sch.mTch': 'By teacher',
    'sch.grade': 'Grade',
    'sch.tph': 'Type or choose a teacher’s surname…',
    'sch.print': 'Print',
    'sch.now': 'Now',
    'sch.tnone': 'No lessons found for this teacher.',
    'sch.pick': 'Choose a teacher in the field above.',
    d0: 'Monday', d1: 'Tuesday', d2: 'Wednesday', d3: 'Thursday', d4: 'Friday', d5: 'Saturday',
    s0: 'Mon', s1: 'Tue', s2: 'Wed', s3: 'Thu', s4: 'Fri', s5: 'Sat'
  }
};

export const S = k => {
  const l = (window.I18N && I18N.current && I18N.current()) || 'uz';
  return (D[l] && D[l][k]) || D.uz[k] || k;
};
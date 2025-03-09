 /**
* קוד JavaScript למימוש אנימציית חשיבה והודעות אישור בטופס נעדרים
* יש להוסיף את הקוד לדף הקיים ולוודא שקיימים האלמנטים הנדרשים בדף
*/

// מחכה שה-DOM ייטען במלואו לפני הפעלת הקוד
document.addEventListener('DOMContentLoaded', function() {
   // מאתר את האלמנטים בדף
   const form = document.getElementById('הוסף נעדר') || document.querySelector('form'); // הטופס
   const submitButton = document.querySelector('button[type="submit"]'); // כפתור השליחה
   
   // בודק אם האלמנטים הדרושים כבר קיימים, אחרת יוצר אותם
   let typingAnimation = document.getElementById('typingAnimation');
   let successMessage = document.getElementById('successMessage');
   let requestIdSpan = document.getElementById('requestId');
   
   // יצירת אלמנט אנימציית החשיבה אם לא קיים
   if (!typingAnimation) {
       typingAnimation = document.createElement('div');
       typingAnimation.id = 'typingAnimation';
       typingAnimation.className = 'typing-animation';
       typingAnimation.innerHTML = `
           <div class="typing-dots">
               <span></span>
               <span></span>
               <span></span>
           </div>
           <p>המערכת מעבדת את הנתונים...</p>
       `;
       
       // הוספת סגנון CSS עבור אנימציית החשיבה אם לא קיים
       if (!document.getElementById('aiAnimationStyles')) {
           const styles = document.createElement('style');
           styles.id = 'aiAnimationStyles';
           styles.textContent = `
               /* אנימציית כתיבה לחיקוי AI */
               .typing-animation {
                   display: none;
                   text-align: center;
                   margin: 20px 0;
                   padding: 15px;
                   background-color: #f8f9fa;
                   border-radius: 8px;
               }
               
               .typing-dots {
                   display: inline-block;
               }
               
               .typing-dots span {
                   display: inline-block;
                   width: 10px;
                   height: 10px;
                   border-radius: 50%;
                   background-color: #1a4789;
                   margin: 0 3px;
                   animation: blink 1.4s infinite both;
               }
               
               .typing-dots span:nth-child(2) {
                   animation-delay: 0.2s;
               }
               
               .typing-dots span:nth-child(3) {
                   animation-delay: 0.4s;
               }
               
               @keyframes blink {
                   0% { opacity: 0.2; }
                   20% { opacity: 1; }
                   100% { opacity: 0.2; }
               }
               
               /* הודעת אישור */
               .success-message {
                   display: none;
                   background-color: #e8f5e9;
                   border-right: 4px solid #4caf50;
                   color: #2e7d32;
                   padding: 15px;
                   margin: 20px 0;
                   border-radius: 4px;
                   font-weight: bold;
                   text-align: center;
                   transition: opacity 0.5s ease;
                   opacity: 0;
               }
           `;
           document.head.appendChild(styles);
       }
       
       // הוספת אלמנט האנימציה לאחר הטופס
       form.parentNode.insertBefore(typingAnimation, form.nextSibling);
   }
   
   // יצירת אלמנט הודעת האישור אם לא קיים
   if (!successMessage) {
       successMessage = document.createElement('div');
       successMessage.id = 'successMessage';
       successMessage.className = 'success-message';
       successMessage.innerHTML = `
           <p>הבקשה לאיתור הנעדר התקבלה בהצלחה במערכת!</p>
           <p>צוות איתור הנעדרים יחל בטיפול מיידי בפנייתך.</p>
           <p>מספר פנייה: <span id="requestId"></span></p>
       `;
       
       // הוספת אלמנט הודעת האישור אחרי אנימציית החשיבה
       typingAnimation.parentNode.insertBefore(successMessage, typingAnimation.nextSibling);
       requestIdSpan = document.getElementById('requestId');
   }
   
   // הוספת מאזין לאירוע שליחת הטופס
   form.addEventListener('submit', function(e) {
       // מניעת שליחת הטופס בצורה רגילה
       e.preventDefault();
       
       // בדיקה שהטופס מלא (אופציונלי - ניתן להרחיב בהתאם לצורך)
       const isFormValid = form.checkValidity();
       if (!isFormValid) {
           // אם הטופס לא תקין, הדפדפן יציג שגיאות ברירת מחדל
           return;
       }
       
       // שינוי כיתוב הכפתור והשבתתו
       const originalButtonText = submitButton.textContent;
       submitButton.textContent = 'מעבד בקשה...';
       submitButton.disabled = true;
       
       // הצגת אנימציית AI
       typingAnimation.style.display = 'block';
       
       // סימולציה של תהליך עיבוד במערכת (3 שניות)
       setTimeout(function() {
           // הסתרת אנימציית החשיבה
           typingAnimation.style.display = 'none';
           
           // עוד שנייה של "עיבוד" לפני הצגת התוצאה
           setTimeout(function() {
               // יצירת מספר פנייה אקראי
               const requestId = 'NM' + new Date().getFullYear() + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
               requestIdSpan.textContent = requestId;
               
               // הצגת הודעת האישור עם אנימציה
               successMessage.style.display = 'block';
               
               // מאפשרים לדפדפן לעדכן את התצוגה לפני הצגת האנימציה
               setTimeout(function() {
                   successMessage.style.opacity = '1';
               }, 50);
               
               // איפוס הכפתור וטשטוש ההודעה לאחר זמן מה (אופציונלי)
               setTimeout(function() {
                   submitButton.textContent = originalButtonText;
                   submitButton.disabled = false;
                   
                   // אם רוצים, ניתן גם להסתיר את ההודעה בהדרגה אחרי זמן מה
                   // successMessage.style.opacity = '0';
                   // setTimeout(() => { successMessage.style.display = 'none'; }, 500);
                   
               }, 5000);
               
               // כאן המקום לשלוח את הנתונים לשרת באמת
               // באמצעות fetch או XMLHttpRequest
               const formData = new FormData(form);
               
               // דוגמה לשליחת נתונים לשרת (מוסתר בהערה כרגע)
               /*
               fetch('/api/missing-persons', {
                   method: 'POST',
                   body: formData
               })
               .then(response => response.json())
               .then(data => {
                   console.log('הנתונים נשלחו בהצלחה:', data);
                   // אפשר לעדכן את מספר הפנייה מהשרת
                   // requestIdSpan.textContent = data.requestId;
               })
               .catch(error => {
                   console.error('שגיאה בשליחת הנתונים:', error);
                   // טיפול בשגיאות
               });
               */
               
           }, 1000);
       }, 2000);
   });
});

export const convertToISOString=(dateTimeString:string)=>{
    // Check if input is valid
    if (!dateTimeString || typeof dateTimeString !== 'string') {
      throw new Error('Invalid input. Expected a date-time string in "YYYY-MM-DD HH:mm" format.');
    }
    
    // Split the input string into date and time parts
    const [datePart, timePart] = dateTimeString.split(' ');
    
    if (!datePart || !timePart) {
      throw new Error('Invalid format. Expected "YYYY-MM-DD HH:mm".');
    }
  
    // Split the date and time parts into their components
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);
    
    // Create a Date object using local time zone
    // const localDate = new Date(year, month - 1, day, hour, minute);
    // console.log(localDate);
    
    
    // Convert to ISO string in UTC
    // const isoString = localDate.toISOString();
    // console.log(isoString,"..................");
    const isoString = `${year.toString().padStart(4, '0')}-${(month).toString().padStart(2, '0')}-${(day).toString().padStart(2, '0')}T${(hour).toString().padStart(2, '0')}:${(minute).toString().padStart(2, '0')}:00.000Z`;

    
    return isoString;
  }
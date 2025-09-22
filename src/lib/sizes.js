export function data_size(bytes) {
  if(bytes < 1024){
    return `${bytes} B`
  }
  if(bytes > 1024 && bytes < 1024**2){
    return `${(Math.round((bytes / (1024)) * 100) / 100).toFixed(2)} KB`
  }
  if(bytes > 1024**2 && bytes < 1024**3){
    return `${(Math.round((bytes / (1024 ** 2)) * 100) / 100).toFixed(2)} MB`
  }
  if(bytes > 1024**3 && bytes < 1024**4){
    return `${(Math.round((bytes / (1024 ** 3)) * 100) / 100).toFixed(2)} GB`
  }
  if(bytes > 1024**4){
    return `${(Math.round((bytes / (1024)) * 100) / 100).toFixed(2)} TB`
  }
}

export function number_size(num){
  if (Math.abs(num) < 1000) {
    return num.toString()
  }
  
  if (Math.abs(num) >= 1000 && Math.abs(num) < 1000000) {
    return `${(Math.round((num / 1000) * 100) / 100).toFixed(1)}K`
  }
  
  if (Math.abs(num) >= 1000000 && Math.abs(num) < 1000000000) {
    return `${(Math.round((num / 1000000) * 100) / 100).toFixed(1)}M`
  }
  
  if (Math.abs(num) >= 1000000000) {
    return `${(Math.round((num / 1000000000) * 100) / 100).toFixed(1)}B`
  }
}
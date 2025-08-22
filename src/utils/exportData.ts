import { Well, Measurement } from '../types/types';

export const exportToCSV = (data: any[], filename: string) => {
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  // Verificar se a API msSaveBlob está disponível (IE/Edge antigos)
  if (navigator && 'msSaveBlob' in navigator) {
    // @ts-ignore: Propriedade msSaveBlob não está definida no tipo Navigator
    navigator.msSaveBlob(blob, filename);
  } else {
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const exportWellData = (well: Well, measurements: Measurement[]) => {
  const formattedData = measurements.map(measurement => {
    const baseData = {
      Data: measurement.timestamp,
      'Nível da Água (m)': measurement.waterLevel,
      'Pressão (PSI)': measurement.pressure,
      'Vazão (m³/h)': measurement.flowRate,
      'Observações': measurement.observations,
      'Medido por': measurement.measuredBy
    };
    
    // Adicionar medições personalizadas se existirem
    const customData: Record<string, any> = {};
    if (measurement.customMeasurements && Array.isArray(measurement.customMeasurements)) {
      measurement.customMeasurements.forEach(item => {
        if (item.name && item.value !== undefined) {
          const fieldName = `${item.name} (${item.unit || '-'})`;
          customData[fieldName] = item.value.toString();
        }
      });
    }
    
    return { ...baseData, ...customData };
  });

  exportToCSV(formattedData, `poço-${well.name}-${new Date().toISOString()}.csv`);
};
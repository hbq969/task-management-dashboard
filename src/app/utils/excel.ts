import * as XLSX from 'xlsx';

// 模板列定义
const TEMPLATE_COLUMNS = ['姓名*', '公司', '部门', '分组', '电话', '邮箱'];

export interface PersonImportData {
  name: string;
  company?: string;
  department?: string;
  group?: string;
  phone?: string;
  email?: string;
}

// 生成模板文件
export function generatePersonTemplate(): Blob {
  const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_COLUMNS]);
  // 设置列宽
  ws['!cols'] = [
    { wch: 15 }, // 姓名
    { wch: 20 }, // 公司
    { wch: 15 }, // 部门
    { wch: 12 }, // 分组
    { wch: 15 }, // 电话
    { wch: 25 }, // 邮箱
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '人员信息');
  const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

// 解析 Excel 文件
export async function parsePersonExcel(file: File): Promise<PersonImportData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const wb = XLSX.read(buffer, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as string[][];

        // 跳过标题行，解析数据
        const result = data.slice(1)
          .filter(row => row[0]?.toString().trim()) // 过滤空行（姓名为空）
          .map(row => ({
            name: row[0]?.toString().trim() || '',
            company: row[1]?.toString().trim() || undefined,
            department: row[2]?.toString().trim() || undefined,
            group: row[3]?.toString().trim() || undefined,
            phone: row[4]?.toString().trim() || undefined,
            email: row[5]?.toString().trim() || undefined,
          }));

        resolve(result);
      } catch (error) {
        reject(new Error('解析 Excel 文件失败，请检查文件格式'));
      }
    };
    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.readAsArrayBuffer(file);
  });
}
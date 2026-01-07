import React from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import dayjs from 'dayjs';
import BrandLogo from '@/assets/images/logo.png';
import { RequirementReport, TaskReport, EmployeeReport, ReportKPI, EmployeeKPI } from '../../../services/report';

// Mock Data Types matching ReportsPage (should be centralized ideally)
export interface MemberRow {
  id: string;
  member: string;
  department: string;
  designation?: string; 
  totalWorkingHrs: number;
  actualEngagedHrs: number;
  // ... other fields if used
}

export interface WorklogRow {
    id: string;
    date: string;
    task: string;
    details: string;
    startTime: string;
    endTime: string;
    engagedTime: string;
}

interface ReportsPdfTemplateProps {
  activeTab: 'requirement' | 'task' | 'member';
  data: RequirementReport[] | TaskReport[] | EmployeeReport[];
  kpis: ReportKPI | EmployeeKPI | any; // Using any for taskKPI structure compatibility
  dateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null;
}

export const ReportsPdfTemplate = ({ activeTab, data, kpis, dateRange }: ReportsPdfTemplateProps) => {
  const generatedDate = dayjs().format('MMM DD, YYYY');
  const periodStart = dateRange && dateRange[0] ? dateRange[0].format('MMM DD, YYYY') : 'Start';
  const periodEnd = dateRange && dateRange[1] ? dateRange[1].format('MMM DD, YYYY') : 'End';

  // Helper to determine status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return { bg: '#E6F4EA', text: '#1E8E3E' };
      case 'In Progress': return { bg: '#E8F0FE', text: '#1967D2' };
      case 'Delayed': return { bg: '#FCE8E6', text: '#C5221F' }; // Or Overdue
      case 'Paid': return { bg: '#E6F4EA', text: '#1E8E3E' };
      case 'Pending': return { bg: '#FEF3C7', text: '#B45309' }; 
      default: return { bg: '#F3F4F6', text: '#4B5563' };
    }
  };

  return (
    <div id="pdf-report-container" style={{
      width: '210mm',
      minHeight: '297mm',
      padding: '40px',
      backgroundColor: 'white',
      fontFamily: "'Inter', sans-serif",
      color: '#111111',
      position: 'absolute',
      left: '-9999px',
      top: 0
    }}>
      {/* Header Section */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottom: '2px solid #EEEEEE',
        paddingBottom: '20px',
        marginBottom: '30px'
      }}>
        <div className="brand-section">
           <img src={BrandLogo.src} alt="Alsonotify" className="h-8 object-contain mb-2" />
           {/* Fallback if logo fails or purely text based on sample: <h1>[Company Name]</h1> */}
        </div>
        <div style={{ textAlign: 'right', fontSize: '12px', color: '#666666' }}>
          <span style={{
            fontFamily: "'Manrope', sans-serif",
            fontWeight: 700,
            fontSize: '16px',
            color: '#111111',
            marginBottom: '4px',
            display: 'block'
          }}>
            {activeTab === 'requirement' ? 'Requirements Report' :
             activeTab === 'task' ? 'Tasks Report' : 'Employees Report'}
          </span>
          <span>Generated: {generatedDate}</span><br />
          <span>Period: {periodStart} - {periodEnd}</span>
        </div>
      </div>

      {/* KPI Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '15px',
        marginBottom: '30px'
      }}>
        {activeTab === 'requirement' && renderRequirementKPIs(kpis as ReportKPI)}
        {activeTab === 'task' && renderTaskKPIs(kpis)}
        {activeTab === 'member' && renderEmployeeKPIs(kpis as EmployeeKPI)}
      </div>

      {/* Table Section */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
        <thead>
          <tr>
            {activeTab === 'requirement' && (
              <>
                <Th style={{ width: '50px' }}>No</Th>
                <Th style={{ width: '25%' }}>Requirement</Th>
                <Th style={{ width: '15%' }}>Manager</Th>
                <Th style={{ width: '15%' }}>Timeline</Th>
                <Th style={{ width: '20%' }}>Hours Utilization</Th>
                <Th style={{ width: '10%' }}>Revenue</Th>
                <Th style={{ width: '10%' }}>Status</Th>
              </>
            )}
            {activeTab === 'task' && (
               <>
                <Th style={{ width: '50px' }}>No</Th>
                <Th>Task</Th>
                <Th>Requirement</Th>
                <Th>Assigned To</Th>
                <Th>Allotted</Th>
                <Th>Engaged</Th>
                <Th>Status</Th>
               </>
            )}
            {activeTab === 'member' && (
              <>
                <Th style={{ width: '50px' }}>No</Th>
                <Th style={{ width: '20%' }}>Employee</Th>
                <Th style={{ width: '25%' }}>Tasks Performance</Th>
                <Th style={{ width: '20%' }}>Load</Th>
                <Th style={{ width: '15%' }}>Investment</Th>
                <Th style={{ width: '15%' }}>Net Profit</Th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {activeTab === 'requirement' && (data as RequirementReport[]).map((row, idx) => (
            <tr key={idx} style={idx % 2 === 0 ? {} : { backgroundColor: '#F9FAFB' }}>
              <Td>{idx + 1}</Td>
              <Td>
                <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '13px', color: '#111111' }}>{row.requirement}</div>
                <div style={{ fontSize: '11px', color: '#666666' }}>{row.partner}</div>
              </Td>
              <Td>{row.manager || '-'}</Td>
              <Td>
                 <div style={{display:'flex', flexDirection:'column'}}>
                    <span>{row.startDate ? dayjs(row.startDate).format('MMM DD') : '-'}</span>
                    <span style={{color: '#999', fontSize: '10px'}}>to {row.endDate ? dayjs(row.endDate).format('MMM DD') : '-'}</span>
                 </div>
              </Td>
              <Td>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{display:'flex', justifyContent:'space-between', fontSize:'11px'}}>
                         <span style={{ fontWeight: 700, color: row.engagedHrs > row.allottedHrs ? '#FF3B3B' : '#111111' }}>{row.engagedHrs}h</span>
                         <span style={{ color: '#666666' }}>of {row.allottedHrs}h</span>
                    </div>
                    <ProgressBar filled={row.engagedHrs} total={row.allottedHrs} color={row.engagedHrs > row.allottedHrs ? '#FF3B3B' : '#111111'} />
                </div>
              </Td>
              <Td style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700 }}>${row.revenue?.toLocaleString()}</Td>
              <Td>
                <span style={{
                   display: 'inline-block',
                   padding: '4px 8px',
                   borderRadius: '99px',
                   fontSize: '10px',
                   fontWeight: 600,
                   textTransform: 'uppercase',
                   backgroundColor: getStatusColor(row.status).bg,
                   color: getStatusColor(row.status).text
                }}>
                  {row.status}
                </span>
              </Td>
            </tr>
          ))}

          {activeTab === 'task' && (data as TaskReport[]).map((row, idx) => (
             <tr key={idx} style={idx % 2 === 0 ? {} : { backgroundColor: '#F9FAFB' }}>
                <Td>{idx + 1}</Td>
                <Td style={{ fontWeight: 600, color: '#111' }}>{row.task}</Td>
                <Td style={{ color: '#666' }}>{row.requirement}</Td>
                <Td>{row.assigned}</Td>
                <Td>{row.allottedHrs}h</Td>
                <Td style={{ fontWeight: 700 }}>{row.engagedHrs}h</Td>
                <Td>
                    <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '99px',
                        fontSize: '10px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        backgroundColor: getStatusColor(row.status).bg,
                        color: getStatusColor(row.status).text
                    }}>
                    {row.status}
                    </span>
                </Td>
             </tr>
          ))}

           {activeTab === 'member' && (data as EmployeeReport[]).map((row, idx) => (
             <tr key={idx} style={idx % 2 === 0 ? {} : { backgroundColor: '#F9FAFB' }}>
                <Td>{idx + 1}</Td>
                <Td>
                    <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '13px', color: '#111111' }}>{row.member}</div>
                    <div style={{ fontSize: '11px', color: '#666666' }}>{row.designation} <span style={{color:'#E5E5E5'}}>|</span> {row.department}</div>
                </Td>
                <Td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{fontWeight: 700, fontSize: '12px'}}>{row.taskStats.assigned} <span style={{fontWeight:400, color:'#666'}}>Assigned</span></span>
                        <div style={{display:'flex', gap:'8px', fontSize:'10px', color:'#666'}}>
                             <div style={{display:'flex', alignItems:'center', gap:'4px'}}><div style={{width:6, height:6, borderRadius:'50%', background:'#0F9D58'}}></div> {row.taskStats.completed}</div>
                             <div style={{display:'flex', alignItems:'center', gap:'4px'}}><div style={{width:6, height:6, borderRadius:'50%', background:'#1A73E8'}}></div> {row.taskStats.inProgress}</div>
                             <div style={{display:'flex', alignItems:'center', gap:'4px'}}><div style={{width:6, height:6, borderRadius:'50%', background:'#FF3B3B'}}></div> {row.taskStats.delayed}</div>
                        </div>
                    </div>
                </Td>
                <Td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{display:'flex', justifyContent:'space-between', fontSize:'11px'}}>
                             <span style={{ fontWeight: 700, color: '#111111' }}>{row.utilization}%</span>
                        </div>
                        <ProgressBar filled={row.utilization} total={100} color={row.utilization > 100 ? '#FF3B3B' : '#111111'} />
                    </div>
                </Td>
                <Td style={{color: '#666'}}>${row.hourlyCost?.toLocaleString()}/hr</Td>
                <Td style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, color: row.profit >= 0 ? '#0F9D58' : '#FF3B3B' }}>
                    ${row.profit?.toLocaleString()}
                </Td>
             </tr>
          ))}
        </tbody>
      </table>

       {/* Footer */}
       <div style={{
           marginTop: 'auto',
           paddingTop: '20px',
           borderTop: '1px solid #EEEEEE',
           display: 'flex',
           justifyContent: 'space-between',
           alignItems: 'center',
           fontSize: '10px',
           color: '#999999',
           position: 'absolute',
           bottom: '40px',
           left: '40px',
           right: '40px'
       }}>
           <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
               <span>Alsonotify Inc.</span>
           </div>
           <span>Page 1 of 1</span>
       </div>
    </div>
  );
};

// --- Sub-components for Cleaner Code ---

const KPICard = ({ label, value, color = '#111111', subValue = null }: { label: string, value: string | number, color?: string, subValue?: React.ReactNode }) => (
  <div style={{
    background: '#FAFAFA',
    border: '1px solid #EEEEEE',
    borderRadius: '12px',
    padding: '15px'
  }}>
    <span style={{
      fontSize: '11px',
      fontWeight: 500,
      color: '#666666',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      marginBottom: '5px',
      display: 'block'
    }}>{label}</span>
    <div style={{display:'flex', alignItems:'baseline', gap:'8px'}}>
        <p style={{
        fontFamily: "'Manrope', sans-serif",
        fontWeight: 700,
        fontSize: '20px',
        margin: 0,
        color: color
        }}>{value}</p>
        {subValue}
    </div>
  </div>
);

const Th = ({ children, style }: { children: React.ReactNode, style?: React.CSSProperties }) => (
  <th style={{
    backgroundColor: '#111111',
    color: 'white',
    fontFamily: "'Manrope', sans-serif",
    fontWeight: 600,
    textAlign: 'left',
    padding: '12px 15px',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    ...style
  }}>
    {children}
  </th>
);

const Td = ({ children, style }: { children: React.ReactNode, style?: React.CSSProperties }) => (
  <td style={{
    padding: '12px 15px',
    borderBottom: '1px solid #EEEEEE',
    fontWeight: 500,
    verticalAlign: 'middle',
    color: '#111111', 
    ...style
  }}>
    {children}
  </td>
);

const ProgressBar = ({ filled, total, color }: { filled: number, total: number, color: string }) => {
    const pct = Math.min((filled / (total || 1)) * 100, 100);
    return (
        <div style={{ width: '100%', height: '6px', backgroundColor: '#F0F0F0', borderRadius: '50px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: '50px' }}></div>
        </div>
    )
}

// --- Render Helpers ---

function renderRequirementKPIs(kpi: ReportKPI) {
    if(!kpi) return null;
    return (
        <>
            <KPICard label="Total Requirements" value={kpi.totalRequirements} />
            <KPICard label="On Time Completed" value={kpi.onTimeCompleted} color="#0F9D58" />
            <KPICard 
                label="Delayed" 
                value={kpi.delayedCompleted} 
                color="#FF3B3B" 
                subValue={kpi.totalExtraHrs > 0 ? <span style={{fontSize:'12px', fontWeight:500, color:'#666'}}>(+{kpi.totalExtraHrs}h)</span> : null}
            />
            <KPICard label="Avg. Efficiency" value={`${kpi.efficiency}%`} color="#2196F3" />
        </>
    )
}

function renderTaskKPIs(kpi: any) {
    if(!kpi) return null;
    return (
        <>
             <KPICard label="Total Tasks" value={kpi.totalTasks} />
            <KPICard label="On Time Completed" value={kpi.onTimeCompleted} color="#0F9D58" />
             <KPICard 
                label="Delayed" 
                value={kpi.delayedCompleted} 
                color="#FF3B3B" 
                subValue={kpi.totalExtraHrs > 0 ? <span style={{fontSize:'12px', fontWeight:500, color:'#666'}}>(+{kpi.totalExtraHrs}h)</span> : null}
            />
            <KPICard label="Avg. Efficiency" value={`${kpi.efficiency}%`} color="#2196F3" />
        </>
    )
}

function renderEmployeeKPIs(kpi: EmployeeKPI) {
    if(!kpi) return null;
    return (
        <>
             <KPICard label="Total Investment" value={`$${kpi.totalInvestment?.toLocaleString()}`} />
             <KPICard label="Total Revenue" value={`$${kpi.totalRevenue?.toLocaleString()}`} color="#0F9D58" />
             <KPICard label="Net Profit" value={`$${kpi.netProfit?.toLocaleString()}`} color={kpi.netProfit >= 0 ? "#0F9D58" : "#FF3B3B"} />
             <KPICard label="Avg. Rate/Hr" value={`$${kpi.avgRatePerHr?.toLocaleString()}`} color="#2196F3" />
        </>
    )
}


// --- Individual Employee Template ---

export const IndividualEmployeePdfTemplate = ({ member, worklogs, dateRange }: { member: MemberRow, worklogs: WorklogRow[], dateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null }) => {
    const generatedDate = dayjs().format('MMM DD, YYYY');
    const periodStart = dateRange && dateRange[0] ? dateRange[0].format('MMM DD, YYYY') : 'Start';
    const periodEnd = dateRange && dateRange[1] ? dateRange[1].format('MMM DD, YYYY') : 'End';
    const efficiency = member.totalWorkingHrs > 0 ? Math.round((member.actualEngagedHrs / member.totalWorkingHrs) * 100) : 0;

    return (
        <div id="pdf-individual-report-container" style={{
            width: '210mm',
            minHeight: '297mm',
            padding: '40px',
            backgroundColor: 'white',
            fontFamily: "'Inter', sans-serif",
            color: '#111111',
            position: 'absolute',
            left: '-9999px',
            top: 0
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                borderBottom: '2px solid #EEEEEE',
                paddingBottom: '20px',
                marginBottom: '30px'
            }}>
                <div className="brand-section">
                    <img src={BrandLogo.src} alt="Alsonotify" className="h-8 object-contain mb-2" />
                </div>
                <div style={{ textAlign: 'right', fontSize: '12px', color: '#666666' }}>
                    <span style={{
                        fontFamily: "'Manrope', sans-serif",
                        fontWeight: 700,
                        fontSize: '16px',
                        color: '#111111',
                        marginBottom: '4px',
                        display: 'block'
                    }}>
                        Employee Performance Report
                    </span>
                    <span>Generated: {generatedDate}</span><br />
                    <span>Period: {periodStart} - {periodEnd}</span>
                </div>
            </div>

            {/* Employee Profile & Stats */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                {/* Profile Card */}
                <div style={{ flex: 1, padding: '20px', background: '#FAFAFA', border: '1px solid #EEEEEE', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#111111',
                            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '20px', fontFamily: "'Manrope', sans-serif", fontWeight: 700
                        }}>
                            {member.member.charAt(0)}
                        </div>
                        <div>
                            <div style={{ fontSize: '18px', fontWeight: 700, color: '#111111', fontFamily: "'Manrope', sans-serif" }}>{member.member}</div>
                            <div style={{ fontSize: '13px', color: '#666666' }}>{member.department}</div>
                        </div>
                    </div>
                </div>

                {/* KPI Cards */}
                 <div style={{ display:'flex', gap:'15px', flex:2 }}>
                    <div style={{ flex:1, padding: '16px', borderRadius: '12px', border: '1px solid #EEEEEE', backgroundColor: '#FAFAFA', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 500, color: '#666666', textTransform:'uppercase' }}>Total Hours</span>
                        <span style={{ fontSize: '24px', fontFamily: "'Manrope', sans-serif", fontWeight: 700, color: '#111111' }}>{member.totalWorkingHrs}h</span>
                    </div>
                    <div style={{ flex:1, padding: '16px', borderRadius: '12px', border: '1px solid #EEEEEE', backgroundColor: '#FAFAFA', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 500, color: '#666666', textTransform:'uppercase' }}>Engaged</span>
                        <span style={{ fontSize: '24px', fontFamily: "'Manrope', sans-serif", fontWeight: 700, color: '#111111' }}>{member.actualEngagedHrs}h</span>
                    </div>
                    <div style={{ flex:1, padding: '16px', borderRadius: '12px', border: '1px solid #EEEEEE', backgroundColor: '#FAFAFA', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 500, color: '#666666', textTransform:'uppercase' }}>Efficiency</span>
                        <span style={{ fontSize: '24px', fontFamily: "'Manrope', sans-serif", fontWeight: 700, color: efficiency >= 90 ? '#0F9D58' : efficiency >= 75 ? '#2196F3' : '#FF3B3B' }}>
                            {efficiency}%
                        </span>
                    </div>
                 </div>
            </div>

            {/* Work History Section */}
            <div style={{ marginBottom: '15px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, fontFamily: "'Manrope', sans-serif", color: '#111111', textTransform: 'uppercase', marginBottom: '15px' }}>Work History</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                        <tr>
                            <Th style={{ width: '100px' }}>Date</Th>
                            <Th style={{ width: '150px' }}>Task</Th>
                            <Th>Details</Th>
                            <Th style={{ width: '120px', textAlign: 'right' }}>Time</Th>
                            <Th style={{ width: '80px', textAlign: 'right' }}>Duration</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {worklogs.map((log, idx) => (
                            <tr key={idx} style={idx % 2 === 0 ? {} : { backgroundColor: '#F9FAFB' }}>
                                <Td style={{ fontWeight: 500, color: '#111111' }}>{log.date}</Td>
                                <Td style={{ fontWeight: 500, color: '#111111' }}>{log.task}</Td>
                                <Td style={{ color: '#666666' }}>{log.details}</Td>
                                <Td style={{ textAlign: 'right', color: '#666666' }}>{log.startTime} - {log.endTime}</Td>
                                <Td style={{ textAlign: 'right', fontWeight: 700, color: '#111111' }}>{log.engagedTime}</Td>
                            </tr>
                        ))}
                         {worklogs.length === 0 && (
                            <tr><Td style={{textAlign:'center', color:'#999'}} colSpan={5}>No work history found.</Td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div style={{
                marginTop: 'auto',
                paddingTop: '20px',
                borderTop: '1px solid #EEEEEE',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '10px',
                color: '#999999',
                position: 'absolute',
                bottom: '40px',
                left: '40px',
                right: '40px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Alsonotify Inc.</span>
                </div>
                <span>Page 1 of 1</span>
            </div>
        </div>
    );
};


// --- Exported Generator Function ---

export const generatePdf = async (fileName: string, elementId: string = 'pdf-report-container') => {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`PDF Container with id ${elementId} not found`);
        return;
    }

    try {
        const canvas = await html2canvas(element, {
            scale: 2, // 2x scale for better resolution
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: 794,
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const imgWidth = pdfWidth; 
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, -1 * (imgHeight - heightLeft), imgWidth, imgHeight);
             heightLeft -= pdfHeight;
        }
        
        pdf.save(fileName);
        return true;
    } catch (error) {
        console.error('PDF Generation failed:', error);
        throw error;
    }
};

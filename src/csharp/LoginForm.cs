using System;
using System.Diagnostics;
using System.Net;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Web;
using System.Windows.Forms;
using System.Net.Http;
using Newtonsoft.Json;
using FingerMan;
using FingerMan.Models;

namespace FingerMan
{
    public partial class LoginForm : Form
    {
        private const int PORT = 5588;
        private HttpListener listener;
        private TaskCompletionSource<UserData> loginCompletionSource;
        private string securityToken;

        public LoginForm()
        {
            InitializeComponent();
        }

        private void LoginForm_Load(object sender, EventArgs e)
        {
            lblStatus.Text = "로그인하려면 버튼을 클릭하세요.";
        }

        private async void btnLogin_Click(object sender, EventArgs e)
        {
            btnLogin.Enabled = false;
            btnLogin.Text = "로그인 중...";
            lblStatus.Text = "브라우저에서 로그인을 완료해주세요...";

            try
            {
                var userData = await StartLoginProcessAsync();
                if (userData != null)
                {
                    lblStatus.Text = $"로그인 성공! 환영합니다, {userData.Name}님";

                    // 새로운 User 객체 생성
                    var user = new User
                    {
                        UserId = userData.UserId,
                        Name = userData.Name
                    };

                    // Form1으로 이동 - User 객체를 전달
                    Form1 mainForm = new Form1(user);
                    this.Hide();
                    mainForm.FormClosed += (s, args) => this.Close();
                    mainForm.Show();
                }
            }
            catch (Exception ex)
            {
                lblStatus.Text = "로그인 실패";
                MessageBox.Show($"로그인 중 오류가 발생했습니다: {ex.Message}", "오류",
                    MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            finally
            {
                btnLogin.Enabled = true;
                btnLogin.Text = "로그인";
            }
        }

        private async Task<UserData> StartLoginProcessAsync()
        {
            // 로컬 HTTP 서버 시작
            StartLocalServer();

            loginCompletionSource = new TaskCompletionSource<UserData>();

            try
            {
                // 보안 토큰 생성 - 간단하고 일관된 형식 사용
                securityToken = DateTime.Now.Ticks.ToString("x");
                Console.WriteLine($"생성된 토큰: {securityToken}");

                // 콜백 URL 생성
                string callbackUrl = $"http://localhost:{PORT}/auth-callback";

                // 기본 브라우저로 로그인 페이지 열기
                string loginUrl = $"http://localhost:3000/?external=1&callback={HttpUtility.UrlEncode(callbackUrl)}&token={securityToken}";
                Process.Start(new ProcessStartInfo
                {
                    FileName = loginUrl,
                    UseShellExecute = true
                });

                // 로그인 완료될 때까지 대기 (최대 5분)
                using (var timeoutCts = new System.Threading.CancellationTokenSource(TimeSpan.FromMinutes(5)))
                {
                    var completedTask = await Task.WhenAny(
                        loginCompletionSource.Task,
                        Task.Delay(Timeout.Infinite, timeoutCts.Token)
                    );

                    if (completedTask == loginCompletionSource.Task)
                    {
                        return await loginCompletionSource.Task;
                    }
                    else
                    {
                        throw new TimeoutException("로그인 시간이 초과되었습니다.");
                    }
                }
            }
            finally
            {
                StopLocalServer();
            }
        }

        private void StartLocalServer()
        {
            if (listener != null && listener.IsListening)
            {
                StopLocalServer();
            }

            listener = new HttpListener();
            listener.Prefixes.Add($"http://localhost:{PORT}/");

            try
            {
                listener.Start();

                // 비동기로 요청 대기
                Task.Run(() => ListenForCallback());
            }
            catch (Exception ex)
            {
                MessageBox.Show($"로컬 서버 시작 실패: {ex.Message}", "오류",
                    MessageBoxButtons.OK, MessageBoxIcon.Error);
                throw;
            }
        }

        private async Task ListenForCallback()
        {
            try
            {
                while (listener != null && listener.IsListening)
                {
                    var context = await listener.GetContextAsync();

                    if (context.Request.Url.AbsolutePath == "/auth-callback")
                    {
                        ProcessCallback(context);
                    }
                    else
                    {
                        // 잘못된 경로 요청 처리
                        using (var response = context.Response)
                        {
                            response.StatusCode = 404;
                            response.Close();
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"리스너 오류: {ex.Message}");
            }
        }

        private void ProcessCallback(HttpListenerContext context)
        {
            // 검증에 필요한 데이터를 미리 추출
            string referer = null;
            string ipAddress = null;
            bool responseIsSent = false;

            try
            {
                // URL 파라미터에서 데이터 추출
                var query = HttpUtility.ParseQueryString(context.Request.Url.Query);
                string loginSuccess = query["loginSuccess"];
                string encodedUserData = query["userData"];
                string token = query["token"];

                // 검증에 필요한 데이터 미리 추출
                referer = context.Request.Headers["Referer"];
                ipAddress = context.Request.RemoteEndPoint.Address.ToString();

                // 디버그 정보 출력
                Console.WriteLine("========== Callback 요청 정보 ==========");
                Console.WriteLine($"요청 IP: {ipAddress}");
                Console.WriteLine($"리퍼러: {referer}");
                Console.WriteLine($"loginSuccess: {loginSuccess}");
                Console.WriteLine($"토큰: {token}");
                Console.WriteLine($"기대 토큰: {securityToken}");
                Console.WriteLine($"요청 URL: {context.Request.Url}");

                // 이미지 요청에 대한 응답 (1x1 투명 픽셀)
                byte[] buffer = Convert.FromBase64String(
                    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7");

                // 응답 헤더 설정
                context.Response.ContentType = "image/gif";
                context.Response.ContentLength64 = buffer.Length;
                context.Response.StatusCode = 200;

                // CORS 헤더 추가
                context.Response.AddHeader("Access-Control-Allow-Origin", "*");
                context.Response.AddHeader("Access-Control-Allow-Methods", "GET");
                context.Response.AddHeader("Cache-Control", "no-cache, no-store");

                // 응답 전송
                context.Response.OutputStream.Write(buffer, 0, buffer.Length);
                context.Response.Close(); // 이후로는 response 객체 사용 불가
                responseIsSent = true;

                // 로그인 결과 처리
                if (loginSuccess == "true" && !string.IsNullOrEmpty(encodedUserData))
                {
                    try
                    {
                        // 토큰 검증 - 강제 활성화
                        if (string.IsNullOrEmpty(token) || token != securityToken)
                        {
                            throw new Exception($"보안 토큰이 유효하지 않습니다.");
                        }

                        // URL 디코딩 및 JSON 문자열을 객체로 변환
                        string decodedUserData = HttpUtility.UrlDecode(encodedUserData);
                        var userObj = JsonConvert.DeserializeObject<UserData>(decodedUserData);

                        // 사용자 데이터 디버그 출력
                        Console.WriteLine($"사용자 ID: {userObj.UserId}, 이름: {userObj.Name}");

                        // 현재 시간과 세션 만료 시간 비교
                        long currentTimeMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                        if (userObj.SessionExpiry < currentTimeMs)
                        {
                            throw new Exception("로그인 세션이 만료되었습니다.");
                        }

                        // 실제 검증 수행 - 이미 추출한 데이터 사용
                        bool isValid = ValidateUser(referer, ipAddress, userObj);

                        if (isValid)
                        {
                            // UI 스레드에서 결과 설정
                            BeginInvoke(new Action(() =>
                            {
                                loginCompletionSource.TrySetResult(userObj);
                            }));
                        }
                        else
                        {
                            BeginInvoke(new Action(() =>
                            {
                                loginCompletionSource.TrySetException(
                                    new Exception("사용자 인증에 실패했습니다."));
                            }));
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"오류 발생: {ex.Message}");
                        BeginInvoke(new Action(() =>
                        {
                            loginCompletionSource.TrySetException(
                                new Exception($"인증 검증 오류: {ex.Message}"));
                        }));
                    }
                }
                else
                {
                    BeginInvoke(new Action(() =>
                    {
                        loginCompletionSource.TrySetException(
                            new Exception("인증 데이터를 받지 못했습니다."));
                    }));
                }
            }
            catch (Exception ex)
            {
                try
                {
                    // 응답이 아직 전송되지 않은 경우에만 응답 전송
                    if (context.Response != null && !responseIsSent)
                    {
                        context.Response.StatusCode = 500;
                        context.Response.Close();
                    }
                }
                catch { /* 무시 */ }

                Console.WriteLine($"콜백 처리 오류: {ex.Message}");
                BeginInvoke(new Action(() =>
                {
                    loginCompletionSource.TrySetException(ex);
                }));
            }
        }

        // HttpListenerRequest 객체를 사용하지 않는 검증 메서드로 변경
        private bool ValidateUser(string referer, string ipAddress, UserData userData)
        {
            try
            {
                // 1. 리퍼러 확인 - 웹사이트에서 온 요청인지 확인
                // 개발 환경에서는 리퍼러 검증 완화 (실제 환경에서 활성화)
                if (!string.IsNullOrEmpty(referer))
                {
                    if (!referer.StartsWith("http://localhost:3000/"))
                    {
                        Console.WriteLine($"의심스러운 리퍼러: {referer}");
                        return false;
                    }
                }
                else
                {
                    // 개발 환경에서는 리퍼러 없는 경우도 허용
                    Console.WriteLine("리퍼러 없음 (개발 환경에서 허용)");
                }

                // 2. 접속 시간 기반 검증
                // 프로그램 시작 후 합리적인 시간 내에 완료되었는지 확인
                TimeSpan elapsed = DateTime.Now - Process.GetCurrentProcess().StartTime;
                if (elapsed.TotalSeconds < 1) // 너무 빨리 온 요청은 의심
                {
                    Console.WriteLine($"의심스러운 요청 시간: {elapsed.TotalSeconds}초");
                    return false;
                }

                // 3. 사용자 ID 검증
                if (string.IsNullOrEmpty(userData.UserId) || userData.Id <= 0)
                {
                    Console.WriteLine("유효하지 않은 사용자 ID");
                    return false;
                }

                // 모든 검증 통과
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"검증 중 오류: {ex.Message}");
                return false;
            }
        }

        private void StopLocalServer()
        {
            if (listener != null && listener.IsListening)
            {
                listener.Stop();
                listener.Close();
                listener = null;
            }
        }

        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            StopLocalServer();
            base.OnFormClosing(e);
        }
    }

    // 사용자 데이터 클래스
    public class UserData
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public string Name { get; set; }
        public long SessionExpiry { get; set; }
    }
}

// Form1에서 필요한 User 클래스 정의
namespace FingerMan.Models
{
    public class User
    {
        public string UserId { get; set; }
        public string Name { get; set; }
    }
}

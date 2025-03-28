useEffect(() => {
    console.log('Hash:', window.location.hash);
    const hash = window.location.hash;
    if (hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      
      console.log('Tokens encontrados:', { accessToken, refreshToken });
      
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      }).then(({ error }) => {
        if (error) {
          console.error('Erro ao definir sessão:', error);
          toast.error('Enlace de recuperación inválido o expirado');
          navigate('/');
        } else {
          console.log('Sessão definida com sucesso');
        }
      });
    } else {
      console.log('Nenhum token encontrado no hash');
      navigate('/');
    }
  }, [navigate]);
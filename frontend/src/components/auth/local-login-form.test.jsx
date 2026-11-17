import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LocalLoginGate } from './local-login-form';

const jsonResponse = (status, body) => Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) });

describe('LocalLoginGate', () => {
  let fetchMock;
  let assign;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    assign = vi.fn();
    vi.stubGlobal('location', { ...window.location, assign });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
  });

  const renderGate = () => render(<LocalLoginGate fallback={<button type="button">Continuar con Google</button>} />);

  it('keeps the Google button when local login is disabled', async () => {
    fetchMock.mockReturnValueOnce(jsonResponse(200, { enabled: false }));
    renderGate();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/auth/local/status', expect.anything()));
    expect(screen.getByRole('button', { name: 'Continuar con Google' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Contraseña')).not.toBeInTheDocument();
  });

  it('keeps the Google button when the status check fails', async () => {
    fetchMock.mockReturnValueOnce(Promise.reject(new Error('offline')));
    renderGate();
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: 'Continuar con Google' })).toBeInTheDocument();
  });

  it('shows the email and password form instead of Google on a local install', async () => {
    fetchMock.mockReturnValueOnce(jsonResponse(200, { enabled: true }));
    renderGate();
    expect(await screen.findByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'password');
    expect(screen.queryByRole('button', { name: 'Continuar con Google' })).not.toBeInTheDocument();
  });

  it('logs in and hands the token to the existing auth flow', async () => {
    fetchMock
      .mockReturnValueOnce(jsonResponse(200, { enabled: true }))
      .mockReturnValueOnce(jsonResponse(200, { access_token: 'tok en', user: { email: 'demo@example.com', name: 'Usuario Demo' } }));
    renderGate();
    fireEvent.change(await screen.findByLabelText('Email'), { target: { value: 'demo@example.com' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'demo1234' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    await waitFor(() => expect(assign).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenLastCalledWith('/auth/local/login', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ email: 'demo@example.com', password: 'demo1234' }),
    }));
    const target = new URL(assign.mock.calls[0][0], 'http://localhost');
    expect(target.pathname).toBe('/');
    expect(target.searchParams.get('auth')).toBe('success');
    expect(target.searchParams.get('token')).toBe('tok en');
    expect(target.searchParams.get('email')).toBe('demo@example.com');
    expect(target.searchParams.get('user')).toBe('Usuario Demo');
  });

  it('shows the server message on wrong credentials and stays on the form', async () => {
    fetchMock
      .mockReturnValueOnce(jsonResponse(200, { enabled: true }))
      .mockReturnValueOnce(jsonResponse(401, { message: 'Email o contraseña incorrectos' }));
    renderGate();
    fireEvent.change(await screen.findByLabelText('Email'), { target: { value: 'demo@example.com' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'mal' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email o contraseña incorrectos');
    expect(assign).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeEnabled();
  });
});
